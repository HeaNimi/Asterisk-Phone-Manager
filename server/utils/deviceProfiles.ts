export type SipDeviceProfile = {
  vendor: 'cisco' | 'snom'
  macAddress: string
  model: string
  extension: string
  authUsername: string
  authPassword: string
  displayName: string
  directoryUrl: string
}
export function snomProfile(phone: { macAddress: string; model: string; extension: string; username: string | null; secret: string; displayName: string | null }, directoryUrl: string): SipDeviceProfile {
  return { vendor: 'snom', macAddress: phone.macAddress, model: phone.model, extension: phone.extension, authUsername: phone.username || phone.extension, authPassword: phone.secret, displayName: phone.displayName || phone.extension, directoryUrl }
}