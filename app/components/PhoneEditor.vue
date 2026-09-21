<script setup lang="ts">
import type { LineKey, Profile, Asset, Phone } from '~/composables/useManagerData'
import { emptyLine, lineFeatures, phoneModels } from '~/composables/useManagerData'

const props = defineProps<{ value: Record<string, any>; profiles: Profile[]; assets: Asset[]; saving?: boolean }>()
const emit = defineEmits<{ save: [value: Record<string, unknown>]; applyProfile: [id: string]; generate: []; reset: [] }>()
const phone = reactive<Record<string, any>>({})
watch(() => props.value, value => Object.assign(phone, value, { lineKeys: (value.lineKeys || []).map((line: LineKey) => ({ ...line })) }), { immediate: true, deep: true })
function addLine() { phone.lineKeys.push(emptyLine(phone.lineKeys.length + 1)) }
function removeLine(index: number) { phone.lineKeys.splice(index, 1) }
</script>

<template>
  <form class="card grid" @submit.prevent="emit('save', { ...phone, lineKeys: phone.lineKeys })">
    <div class="form-heading"><h2>{{ phone.id ? 'Edit phone' : 'Create phone' }}</h2><UButton v-if="phone.id" label="New" color="neutral" variant="soft" type="button" @click="emit('reset')" /></div>
    <div class="grid two">
      <label>Name<input v-model="phone.name" required></label><label>Extension<input v-model="phone.extension" pattern="[0-9]{1,10}" required></label>
      <label>MAC address<input v-model="phone.macAddress" placeholder="001122334455" required></label><label>Model<select v-model="phone.model"><option v-for="model in phoneModels" :key="model">{{ model }}</option></select></label>
      <label>SIP secret<input v-model="phone.secret" :required="!phone.id" type="password"></label><label>SIP username<input v-model="phone.username" placeholder="Optional"></label>
      <label>Display name<input v-model="phone.displayName"></label><label class="check"><input v-model="phone.enabled" type="checkbox"> Enabled</label>
    </div>
    <div v-if="phone.id" class="toolbar"><select :value="phone.profileId" aria-label="Apply reusable profile" @change="emit('applyProfile', ($event.target as HTMLSelectElement).value)"><option value="">Apply reusable profile…</option><option v-for="item in profiles" :key="item.id" :value="item.id">{{ item.name }}</option></select><UButton label="Generate SEP XML" icon="lucide:file-code-2" color="neutral" variant="soft" type="button" @click="emit('generate')" /></div>
    <details open><summary>Time and call servers</summary><div class="grid two form-section"><label>Primary server<input v-model="phone.callManagerPrimary" required></label><label>Failover server<input v-model="phone.callManagerFailover" placeholder="Optional"></label><label>Timezone<input v-model="phone.timezone"></label><label>NTP server<input v-model="phone.ntpServer" placeholder="Optional"></label></div></details>
    <details open><summary>Web and security</summary><div class="grid two form-section"><label class="check"><input v-model="phone.webAccess" type="checkbox"> Enable web access</label><label class="check"><input v-model="phone.settingsAccess" type="checkbox"> Allow phone settings</label><label class="check"><input v-model="phone.sshAccess" type="checkbox"> Enable SSH access</label></div></details>
    <details open><summary>SIP, voicemail and ring</summary><div class="grid two form-section"><label>SIP transport<select v-model="phone.sipTransport"><option>UDP</option><option>TCP</option><option>TLS</option></select></label><label>Voicemail number<input v-model="phone.voicemailNumber" placeholder="*97"></label><label>Voicemail label<input v-model="phone.voicemailName"></label><label>Default ring setting<select v-model="phone.ringSetting"><option>Cisco</option><option>Chirp</option><option>Silent</option><option>Inside</option></select></label><label class="check"><input v-model="phone.callWaiting" type="checkbox"> Call waiting</label><label class="check"><input v-model="phone.doNotDisturb" type="checkbox"> Do not disturb</label><label class="check"><input v-model="phone.autoAnswer" type="checkbox"> Auto answer</label></div></details>
    <details open><summary>Line keys and buttons</summary><div class="form-section"><div v-for="(line,index) in phone.lineKeys" :key="index" class="line-row"><b>{{ line.position }}</b><input v-model="line.label" placeholder="Label" required><input v-model="line.extension" placeholder="Extension"><select v-model="line.feature"><option v-for="feature in lineFeatures" :key="feature.value" :value="feature.value">{{ feature.label }}</option></select><select v-model="line.ringSetting"><option :value="null">Default ring</option><option>Cisco</option><option>Chirp</option><option>Silent</option></select><UButton icon="lucide:x" color="error" variant="ghost" type="button" aria-label="Remove line key" @click="removeLine(index)" /></div><UButton label="Add line key" icon="lucide:plus" color="neutral" variant="soft" type="button" @click="addLine" /></div></details>
    <details open><summary>Background asset</summary><div class="form-section"><select v-model="phone.backgroundAssetId"><option value="">No background image</option><option v-for="asset in assets" :key="asset.id" :value="asset.id">{{ asset.filename }}</option></select><small class="muted">Upload images in TFTP assets; the host TFTP service serves them.</small></div></details>
    <UButton :label="saving ? 'Saving…' : phone.id ? 'Save phone changes' : 'Create phone'" :loading="saving" type="submit" />
  </form>
</template>

<style scoped>
.form-heading{display:flex;justify-content:space-between;align-items:center}.form-heading h2{margin:0;font-size:1.05rem}.toolbar{display:flex;gap:.5rem;flex-wrap:wrap}.toolbar select{flex:1}.line-row{display:grid;grid-template-columns:2rem 1.3fr 1fr 1.2fr 1fr auto;gap:.4rem;align-items:center;margin-bottom:.5rem}.line-row input,.line-row select{min-width:0}details{border-top:1px solid #e8edf4;padding-top:.7rem}summary{cursor:pointer;color:#3d4b60;font-size:.8rem;font-weight:700}@media(max-width:850px){.line-row{grid-template-columns:2rem 1fr 1fr auto}.line-row select:first-of-type{grid-column:2}.line-row select:last-of-type{grid-column:3}}
</style>
