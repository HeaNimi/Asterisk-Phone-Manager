<script setup lang="ts">
import type { Profile } from "~/composables/useManagerData";
import {
  emptyLine,
  lineFeatures,
  phoneModels,
} from "~/composables/useManagerData";
const emit = defineEmits<{ save: [value: Record<string, unknown>] }>();
const profile = reactive<Record<string, any>>({
  name: "",
  model: "Cisco 8841",
  callManagerPrimary: "asterisk",
  callManagerFailover: "",
  timezone: "Etc/UTC",
  ntpServer: "",
  webAccess: false,
  settingsAccess: true,
  sshAccess: false,
  callWaiting: true,
  doNotDisturb: false,
  autoAnswer: false,
  voicemailNumber: "*97",
  voicemailName: "",
  ringSetting: "Cisco",
  sipTransport: "UDP",
  backgroundAssetId: "",
  lineKeys: [emptyLine()],
});
function addLine() {
  profile.lineKeys.push(emptyLine(profile.lineKeys.length + 1));
}
function removeLine(index: number) {
  profile.lineKeys.splice(index, 1);
}
function save() {
  emit("save", { ...profile, lineKeys: profile.lineKeys });
  Object.assign(profile, { name: "", lineKeys: [emptyLine()] });
}
</script>

<template>
  <form class="card grid" @submit.prevent="save">
    <h2>Reusable profile</h2>
    <p class="muted">
      Save common phone settings and line buttons for quick application.
    </p>
    <label>Profile name<input v-model="profile.name" required /></label>
    <div class="grid two">
      <label
        >Model<select v-model="profile.model">
          <option v-for="model in phoneModels" :key="model">{{ model }}</option>
        </select></label
      ><label
        >Primary server<input
          v-model="profile.callManagerPrimary"
          required /></label
    </div>
    <div
      v-for="(line, index) in profile.lineKeys"
      :key="index"
      class="line-row"
    >
      <input v-model="line.label" placeholder="Line label" required /><input
        v-model="line.extension"
        placeholder="Extension"
      /><select v-model="line.feature">
        <option
          v-for="feature in lineFeatures"
          :key="feature.value"
          :value="feature.value"
        >
          {{ feature.label }}
        </option></select
      ><UButton
        icon="lucide:x"
        color="error"
        variant="ghost"
        type="button"
        aria-label="Remove profile line"
        @click="removeLine(index)"
      />
    </div>
    <UButton
      label="Add profile button"
      icon="lucide:plus"
      color="neutral"
      variant="soft"
      type="button"
      @click="addLine"
    /><UButton label="Save profile" type="submit" />
  </form>
</template>

<style scoped>
h2 {
  margin: 0;
  font-size: 1.05rem;
}
.line-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr auto;
  gap: 0.4rem;
  align-items: center;
}
</style>
