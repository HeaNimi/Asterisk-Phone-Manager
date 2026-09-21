export type LineKey = {
  position: number
  label: string
  extension: string | null
  feature: string
  ringSetting: string | null
}

export type Phone = {
  id: string
  extension: string
  name: string
  macAddress: string
  model: string
  enabled: boolean
  status?: 'Enabled' | 'Disabled'
  configState?: string
  lineKeys: LineKey[]
  [key: string]: unknown
}

export type Profile = {
  id: string
  name: string
  lineKeys: LineKey[]
  [key: string]: unknown
}

export type Extension = {
  id: string
  extension: string
  name: string
  displayName: string | null
  enabled: boolean
  status: 'Enabled' | 'Disabled' | 'Unassigned'
  configState: string
  phone?: Phone | null
  [key: string]: unknown
}

export type Contact = { id: string; name: string; number: string; description: string | null; speedDial: string | null }
export type Asset = { id: string; filename: string; size: number; mimeType?: string }

export const phoneModels = ['Cisco 8841', 'Cisco 8851', 'Cisco 8861', 'Cisco 8865', 'Cisco 7821', 'Cisco 7841']
export const lineFeatures = [
  { value: 'line', label: 'Line' },
  { value: 'speed-dial', label: 'Speed dial' },
  { value: 'blf', label: 'Busy lamp (BLF)' },
  { value: 'park', label: 'Call park' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'service', label: 'Service' }
]

export function emptyLine(position = 1): LineKey {
  return { position, label: '', extension: null, feature: 'line', ringSetting: null }
}

export function emptyPhone(): Record<string, unknown> {
  return {
    id: '', name: '', extension: '', macAddress: '', model: 'Cisco 8841', secret: '', username: '',
    displayName: '', enabled: true, profileId: '', callManagerPrimary: 'asterisk',
    callManagerFailover: '', timezone: 'Etc/UTC', ntpServer: '', webAccess: false,
    settingsAccess: true, sshAccess: false, callWaiting: true, doNotDisturb: false,
    autoAnswer: false, voicemailNumber: '*97', voicemailName: '', ringSetting: 'Cisco',
    sipTransport: 'UDP', backgroundAssetId: '', lineKeys: [emptyLine()]
  }
}

export function useManagerData() {
  const auth = useState<{ username: string } | null>('manager-auth', () => null)
  const phones = useState<Phone[]>('manager-phones', () => [])
  const extensions = useState<Extension[]>('manager-extensions', () => [])
  const profiles = useState<Profile[]>('manager-profiles', () => [])
  const contacts = useState<Contact[]>('manager-contacts', () => [])
  const assets = useState<Asset[]>('manager-assets', () => [])
  const error = useState('manager-error', () => '')
  const message = useState('manager-message', () => '')

  async function load() {
    error.value = ''
    try {
      auth.value = await $fetch<{ username: string }>('/api/auth/me')
      const [loadedPhones, loadedExtensions, loadedProfiles, loadedContacts, loadedAssets] = await Promise.all([
        $fetch<Phone[]>('/api/phones'),
        $fetch<Extension[]>('/api/extensions'),
        $fetch<Profile[]>('/api/profiles'),
        $fetch<Contact[]>('/api/contacts'),
        $fetch<Asset[]>('/api/tftp')
      ])
      phones.value = loadedPhones
      extensions.value = loadedExtensions
      profiles.value = loadedProfiles
      contacts.value = loadedContacts
      assets.value = loadedAssets
    } catch {
      await navigateTo('/login')
    }
  }

  async function saveExtension(value: Record<string, unknown>) {
    try {
      const id = String(value.id || '')
      await $fetch(id ? `/api/extensions/${id}` : '/api/extensions', {
        method: id ? 'PUT' : 'POST',
        body: { ...value, phoneId: value.phoneId || null }
      })
      message.value = id ? 'Extension updated' : 'Extension created'
      await load()
    } catch (cause: unknown) {
      const errorData = cause as { data?: { statusMessage?: string } }
      error.value = errorData.data?.statusMessage || 'Could not save extension'
      throw cause
    }
  }

  async function deleteExtension(id: string) {
    await $fetch(`/api/extensions/${id}`, { method: 'DELETE' })
    message.value = 'Extension deleted'
    await load()
  }

  async function savePhone(value: Record<string, unknown>) {
    try {
      const id = String(value.id || '')
      const body: Record<string, unknown> = {
        ...value,
        id: undefined,
        lineKeys: (value.lineKeys as LineKey[]).map(line => ({
          ...line,
          extension: line.extension || null,
          ringSetting: line.ringSetting || null
        }))
      }
      if (!body.secret && id) delete body.secret
      await $fetch(id ? `/api/phones/${id}` : '/api/phones', { method: id ? 'PUT' : 'POST', body })
      message.value = id ? 'Phone updated' : 'Phone created'
      await load()
    } catch (cause: unknown) {
      const errorData = cause as { data?: { statusMessage?: string } }
      error.value = errorData.data?.statusMessage || 'Could not save phone'
      throw cause
    }
  }

  async function deletePhone(id: string) {
    await $fetch(`/api/phones/${id}`, { method: 'DELETE' })
    message.value = 'Phone deleted'
    await load()
  }

  async function saveProfile(value: Record<string, unknown>) {
    try {
      await $fetch('/api/profiles', { method: 'POST', body: value })
      message.value = 'Profile saved'
      await load()
    } catch (cause: unknown) {
      const errorData = cause as { data?: { statusMessage?: string } }
      error.value = errorData.data?.statusMessage || 'Could not save profile'
      throw cause
    }
  }

  async function saveContact(value: Record<string, unknown>) {
    try {
      await $fetch('/api/contacts', { method: 'POST', body: value })
      message.value = 'Contact saved'
      await load()
    } catch (cause: unknown) {
      const errorData = cause as { data?: { statusMessage?: string } }
      error.value = errorData.data?.statusMessage || 'Could not save contact'
      throw cause
    }
  }

  async function deleteContact(id: string) {
    await $fetch(`/api/contacts/${id}`, { method: 'DELETE' })
    await load()
  }

  async function uploadAsset(file: File) {
    const body = new FormData()
    body.append('file', file)
    try {
      await $fetch('/api/tftp', { method: 'POST', body })
      message.value = 'Asset uploaded'
      await load()
    } catch (cause: unknown) {
      const errorData = cause as { data?: { statusMessage?: string } }
      error.value = errorData.data?.statusMessage || 'Upload failed'
      throw cause
    }
  }

  async function deleteAsset(id: string) {
    await $fetch(`/api/tftp/${id}`, { method: 'DELETE' })
    await load()
  }

  async function generateAsterisk() {
    await $fetch('/api/generate/asterisk')
    message.value = 'Configuration files generated in the configured mount'
  }

  async function generatePhoneConfig(macAddress: string) {
    await $fetch(`/api/generate/ucma/${macAddress}`)
    message.value = 'Cisco configuration generated in the TFTP directory'
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    auth.value = null
    await navigateTo('/login')
  }

  return {
    auth, phones, extensions, profiles, contacts, assets, error, message, load,
    saveExtension, deleteExtension, savePhone, deletePhone, saveProfile,
    saveContact, deleteContact, uploadAsset, deleteAsset, generateAsterisk,
    generatePhoneConfig, logout
  }
}
