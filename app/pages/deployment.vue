<script setup lang="ts">
const manager = useManagerData();
const generating = ref(false);
async function generate() {
  generating.value = true;
  try {
    await manager.generateAsterisk();
  } finally {
    generating.value = false;
  }
}
onMounted(manager.load);
</script>

<template>
  <AppShell>
    <section class="card deployment">
      <p class="eyebrow">Configuration output</p>
      <h2>Deployment tools</h2>
      <p class="muted">
        Generate bind-mounted Asterisk configuration from the inventory. Cisco
        configuration is generated per phone and written to TFTP.
      </p>
      <UButton
        :label="generating ? 'Generating…' : 'Generate configuration files'"
        icon="lucide:refresh-cw"
        :loading="generating"
        @click="generate"
      />
      <div class="endpoint-grid">
        <div>
          <h3>Phone endpoints</h3>
          <code>/api/directory</code><span>Cisco XML directory</span
          ><code>/api/generate/ucma/&lt;MAC&gt;</code><span>Cisco SEP XML</span>
        </div>
        <div>
          <h3>Host-side TFTP</h3>
          <p class="muted">
            This application writes assets and generated phone files only. Serve
            the configured directory with your host TFTP daemon.
          </p>
        </div>
      </div>
    </section>
  </AppShell>
</template>

<style scoped>
.deployment {
  max-width: 900px;
}
.deployment h2 {
  margin: 0.25rem 0;
  font-size: 1.25rem;
}
.deployment > p {
  max-width: 680px;
  line-height: 1.55;
}
.endpoint-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e4eaf2;
}
.endpoint-grid h3 {
  font-size: 0.85rem;
  margin: 0.2rem 0 0.65rem;
}
.endpoint-grid code,
.endpoint-grid span {
  display: block;
}
.endpoint-grid code {
  margin: 0.45rem 0 0.15rem;
  color: #315fae;
  font-size: 0.77rem;
}
.endpoint-grid span {
  color: #6f7c91;
  font-size: 0.73rem;
}
@media (max-width: 650px) {
  .endpoint-grid {
    grid-template-columns: 1fr;
  }
}
</style>
