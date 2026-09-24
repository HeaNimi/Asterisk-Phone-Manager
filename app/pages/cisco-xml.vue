<script setup lang="ts">
const manager = useManagerData();
type CiscoGlobalConfig = {
  loadInformation: string | null;
  inactiveLoadInformation: string | null;
  timezone: string;
  ntpServer: string | null;
  directoryEnabled: boolean;
  directoryUrl: string | null;
  messagesUrl: string | null;
  servicesUrl: string | null;
  fullConfig: boolean;
  advancedXml: string;
};

const config = reactive<CiscoGlobalConfig>({
  loadInformation: null,
  inactiveLoadInformation: null,
  timezone: "Etc/UTC",
  ntpServer: null,
  directoryEnabled: true,
  directoryUrl: null,
  messagesUrl: null,
  servicesUrl: null,
  fullConfig: true,
  advancedXml: "",
});
const saving = ref(false);

onMounted(async () => {
  try {
    Object.assign(
      config,
      await $fetch<CiscoGlobalConfig>("/api/cisco-global-config" as never),
    );
  } catch {
    await navigateTo("/login");
  }
});

async function save() {
  saving.value = true;
  try {
    await $fetch("/api/cisco-global-config", {
      method: "PUT",
      body: config,
    });
    manager.message.value = "Global Cisco XML settings saved";
  } catch (cause: unknown) {
    const error = cause as { data?: { statusMessage?: string } };
    manager.error.value =
      error.data?.statusMessage || "Could not save Cisco XML settings";
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <AppShell>
    <form class="card settings" @submit.prevent="save">
      <div>
        <h2>Global Cisco XML template</h2>
        <p class="muted">
          Applied to every generated SEP configuration. Phone provisioning keeps
          only phone-specific fields.
        </p>
      </div>
      <details open>
        <summary>Firmware and time</summary>
        <div class="grid two form-section">
          <label
            >Firmware load<input
              v-model="config.loadInformation"
              placeholder="sip88xx.14-0-1-0209-31"
          /></label>
          <label
            >Inactive firmware load<input
              v-model="config.inactiveLoadInformation"
          /></label>
          <label>Timezone<input v-model="config.timezone" required /></label>
          <label>NTP server<input v-model="config.ntpServer" /></label>
        </div>
      </details>
      <details open>
        <summary>Phone services</summary>
        <div class="grid two form-section">
          <label class="check"
            ><input v-model="config.directoryEnabled" type="checkbox" /> Enable
            directory / phonebook</label
          >
          <label
            >Directory URL<input
              v-model="config.directoryUrl"
              placeholder="Defaults to this app's directory"
          /></label>
          <label>Messages URL<input v-model="config.messagesUrl" /></label>
          <label>Services URL<input v-model="config.servicesUrl" /></label>
        </div>
      </details>
      <details open>
        <summary>Advanced XML</summary>
        <div class="form-section">
          <label class="check"
            ><input v-model="config.fullConfig" type="checkbox" /> Emit
            <code>fullConfig=true</code></label
          >
          <label
            >Device XML fragment<textarea
              v-model="config.advancedXml"
              rows="12"
              spellcheck="false"
              placeholder="&lt;vendorConfig&gt;...&lt;/vendorConfig&gt;"
            />
          </label>
          <small class="muted"
            >Inserted inside <code>&lt;device&gt;</code>. Do not include
            <code>&lt;device&gt;</code> or the XML declaration.</small
          >
        </div>
      </details>
      <UButton
        :label="saving ? 'Saving…' : 'Save global template'"
        :loading="saving"
        type="submit"
      />
    </form>
  </AppShell>
</template>

<style scoped>
.settings {
  display: grid;
  gap: 1rem;
  max-width: 940px;
}
h2 {
  margin: 0;
}
p {
  margin-bottom: 0;
}
details {
  border-top: 1px solid #e8edf4;
  padding-top: 0.7rem;
}
summary {
  cursor: pointer;
  font-weight: 700;
  color: #3d4b60;
}
textarea {
  display: block;
  width: 100%;
  margin-top: 0.35rem;
  font-family: ui-monospace, monospace;
}
</style>
