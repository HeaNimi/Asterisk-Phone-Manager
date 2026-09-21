<script setup lang="ts">
const manager = useManagerData()
const { assets } = manager
async function upload(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (file) await manager.uploadAsset(file) }
async function remove(id: string) { if (confirm('Delete this asset?')) await manager.deleteAsset(id) }
onMounted(manager.load)
</script>

<template>
  <AppShell>
    <section class="card assets"><div class="section-heading"><div><h2>TFTP assets</h2><p class="muted">Files are stored in the host-mounted TFTP directory. Maximum upload size: 5 MB.</p></div><label class="upload-button"><UButton label="Upload file" icon="lucide:upload" color="neutral" variant="soft" as="span" /><input type="file" @change="upload"></label></div><div v-for="asset in assets" :key="asset.id" class="asset-row"><div><strong>{{ asset.filename }}</strong><span>{{ Math.round(asset.size / 1024) }} KB<template v-if="asset.mimeType"> · {{ asset.mimeType }}</template></span></div><UButton label="Delete" color="error" variant="soft" size="sm" type="button" @click="remove(asset.id)" /></div><p v-if="!assets.length" class="muted">No assets uploaded yet.</p></section>
  </AppShell>
</template>

<style scoped>
.assets{max-width:920px}.section-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}.section-heading h2{margin:0;font-size:1.05rem}.section-heading p{margin:.3rem 0}.upload-button{display:inline-flex;align-items:center;white-space:nowrap}.upload-button input{display:none}.asset-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.75rem 0;border-bottom:1px solid #e5ebf2}.asset-row strong,.asset-row span{display:block}.asset-row span{color:#6f7c91;font-size:.75rem;margin-top:.2rem}@media(max-width:600px){.section-heading{flex-direction:column}.asset-row{align-items:flex-start;flex-direction:column}}
</style>
