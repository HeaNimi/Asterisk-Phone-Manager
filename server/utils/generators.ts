import { xmlEscape } from './auth'

type LineKey = { position: number; label: string; extension: string | null; feature: string; ringSetting: string | null }
type Phone = {
  enabled: boolean
  extension: string
  macAddress: string
  model: string
  secret: string
  displayName: string | null
  username: string | null
  callManagerPrimary?: string
  callManagerFailover?: string | null
  timezone?: string
  ntpServer?: string | null
  webAccess?: boolean
  settingsAccess?: boolean
  sshAccess?: boolean
  callWaiting?: boolean
  doNotDisturb?: boolean
  autoAnswer?: boolean
  voicemailNumber?: string | null
  voicemailName?: string | null
  ringSetting?: string
  sipTransport?: string
  backgroundAsset?: { filename: string } | null
  lineKeys?: LineKey[]
}
type Contact = { name: string; number: string; description: string | null }
type SipAccount = { enabled: boolean; extension: string; username: string | null; secret: string }

const text = (value: unknown, fallback = '') => xmlEscape(String(value ?? fallback))
const bool = (value: boolean | undefined, fallback: boolean) => (value ?? fallback ? 'true' : 'false')
const featureId: Record<string, string> = { line: '9', 'speed-dial': '2', blf: '20', park: '21', voicemail: '156', service: '0' }

export function ciscoDirectory(contacts: Contact[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<CiscoIPPhoneDirectory><Title>Company Directory</Title><Prompt>Select a contact</Prompt>${contacts.map(c => `<DirectoryEntry><Name>${text(c.name)}</Name><Telephone>${text(c.number)}</Telephone></DirectoryEntry>`).join('')}</CiscoIPPhoneDirectory>`
}

export function ciscoConfig(phone: Phone, server: string) {
  const mac = phone.macAddress.replace(/[^A-Fa-f0-9]/g, '').toUpperCase()
  const primary = phone.callManagerPrimary && phone.callManagerPrimary !== 'asterisk' ? phone.callManagerPrimary : server
  const failover = phone.callManagerFailover || ''
  const managers = [primary, failover].filter((value, index, list) => value && list.indexOf(value) === index)
  const managerXml = managers.map((host, index) => `<member priority="${index}"><callManager><name>${text(host)}</name><ports><ethernetPhonePort>2000</ethernetPhonePort></ports></callManager></member>`).join('')
  const lines = (phone.lineKeys?.length ? phone.lineKeys : [{ position: 1, label: phone.displayName || phone.extension, extension: phone.extension, feature: 'line', ringSetting: phone.ringSetting || null }])
    .sort((a, b) => a.position - b.position)
    .map(line => {
      const extension = line.extension || phone.extension
      const isLine = line.feature === 'line'
      return `<line button="${line.position}"><featureID>${featureId[line.feature] || '9'}</featureID><featureLabel>${text(line.label)}</featureLabel><name>${text(extension)}</name><displayName>${text(line.label)}</displayName>${isLine ? `<authName>${text(phone.username || phone.extension)}</authName><authPassword>${text(phone.secret)}</authPassword><proxy>USECALLMANAGER</proxy><port>5060</port>` : `<speedDialNumber>${text(extension)}</speedDialNumber>`}<ringSettingIdle>${text(line.ringSetting || phone.ringSetting || 'Cisco')}</ringSettingIdle><ringSettingActive>${text(line.ringSetting || phone.ringSetting || 'Cisco')}</ringSettingActive></line>`
    }).join('')
  const background = phone.backgroundAsset?.filename
    ? `<backgroundImageAccess>1</backgroundImageAccess><backgroundImage>${text(phone.backgroundAsset.filename)}</backgroundImage><backgroundImageURL>http://${text(primary)}/tftp/${text(phone.backgroundAsset.filename)}</backgroundImageURL>`
    : '<backgroundImageAccess>0</backgroundImageAccess>'
  const features = `<feature item="CallWaiting" enabled="${bool(phone.callWaiting, true)}"/><feature item="DoNotDisturb" enabled="${bool(!phone.doNotDisturb, true)}"/><feature item="AutoAnswer" enabled="${bool(phone.autoAnswer, false)}"/>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<device>
<deviceProtocol>SIP</deviceProtocol>
<deviceName>SEP${text(mac)}</deviceName>
<modelNumber>${text(phone.model)}</modelNumber>
<processNodeName>${text(primary)}</processNodeName>
<vendorConfig><webAccess>${phone.webAccess ? '1' : '0'}</webAccess><sshAccess>${phone.sshAccess ? '1' : '0'}</sshAccess></vendorConfig>
<commonConfig><phoneConfig><webAccess>${phone.webAccess ? '1' : '0'}</webAccess><settingsAccess>${phone.settingsAccess ? '1' : '0'}</settingsAccess><callWaiting>${phone.callWaiting ? '1' : '0'}</callWaiting></phoneConfig>${background}</commonConfig>
<loadInformation>${text(phone.model)}</loadInformation>
<dateTimeSetting><dateTemplate>M/D/YA</dateTemplate><timeZone>${text(phone.timezone, 'Etc/UTC')}</timeZone>${phone.ntpServer ? `<ntps><ntp><name>${text(phone.ntpServer)}</name></ntp></ntps>` : ''}</dateTimeSetting>
<callManagerGroup><members>${managerXml}</members><selectionOrder>0</selectionOrder></callManagerGroup>
<directoryURL>http://${text(primary)}/api/directory</directoryURL><messagesURL>http://${text(primary)}/messages</messagesURL>
<featureControlPolicy>${features}</featureControlPolicy>
<messagesNumber>${text(phone.voicemailNumber || '*97')}</messagesNumber>
<sipProfile><transportLayerProtocol>${text(phone.sipTransport || 'UDP')}</transportLayerProtocol><sipProxies><backupProxy>USECALLMANAGER</backupProxy><backupProxyPort>5060</backupProxyPort><emergencyProxy>USECALLMANAGER</emergencyProxy><emergencyProxyPort>5060</emergencyProxyPort><outboundProxy>USECALLMANAGER</outboundProxy><outboundProxyPort>5060</outboundProxyPort><registerWithProxy>true</registerWithProxy></sipProxies><sipLines>${lines}</sipLines><phoneLabel>${text(phone.voicemailName || phone.displayName || phone.extension)}</phoneLabel></sipProfile>
</device>`
}

export function pjsipConfig(accounts: SipAccount[]) {
  return accounts.filter(p => p.username !== null || p.extension).map(p => `[${p.extension}]\ntype=endpoint\ncontext=phones\ndisallow=all\nallow=ulaw,alaw\nauth=${p.extension}-auth\naors=${p.extension}-aor\ndirect_media=no\n\n[${p.extension}-auth]\ntype=auth\nauth_type=userpass\nusername=${p.username || p.extension}\npassword=${p.secret}\n\n[${p.extension}-aor]\ntype=aor\nmax_contacts=1\nremove_existing=yes\n`).join('\n')
}

export function extensionsConfig(accounts: SipAccount[]) {
  return `[phones]\n${accounts.filter(p => p.enabled).map(p => `exten => ${p.extension},1,Dial(PJSIP/${p.extension},20)\n same => n,Hangup()`).join('\n')}\n`
}
