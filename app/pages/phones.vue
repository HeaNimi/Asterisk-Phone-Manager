<script setup lang="ts">
import { emptyPhone } from "~/composables/useManagerData";
const manager = useManagerData();
const { phones, profiles, assets } = manager;
const phone = reactive<Record<string, any>>(emptyPhone());
const saving = ref(false);

function resetPhone() {
  Object.assign(phone, emptyPhone());
}
function editPhone(value: Record<string, any>) {
  Object.assign(phone, emptyPhone(), value, {
    secret: "",
    lineKeys: (value.lineKeys || []).map((line: Record<string, unknown>) => ({
      ...line,
    })),
  });
}
async function savePhone(value: Record<string, unknown>) {
  saving.value = true;
  try {
    await manager.savePhone(value);
    resetPhone();
  } finally {
    saving.value = false;
  }
}
async function applyProfile(profileId: string) {
  if (!phone.id || !profileId) return;
  try {
    await $fetch(`/api/phones/${phone.id}/profile`, {
      method: "POST",
      body: { profileId },
    });
    manager.message.value = "Profile applied";
    await manager.load();
    const updated = manager.phones.value.find((item) => item.id === phone.id);
    if (updated) editPhone(updated);
  } catch {
    manager.error.value = "Could not apply profile";
  }
}
async function generate() {
  if (phone.macAddress) await manager.generatePhoneConfig(phone.macAddress);
}
async function removePhone(id: string) {
  if (confirm("Delete this phone?")) {
    if (phone.id === id) resetPhone();
    await manager.deletePhone(id);
  }
}
onMounted(manager.load);
</script>

<template>
  <AppShell>
    <div class="page-grid">
      <PhoneEditor
        :value="phone"
        :profiles="profiles"
        :assets="assets"
        :saving="saving"
        @save="savePhone"
        @reset="resetPhone"
        @apply-profile="applyProfile"
        @generate="generate"
      />
      <div class="side-stack">
        <section class="card inventory">
          <div class="section-heading">
            <h2>Phone inventory</h2>
            <span class="count">{{ phones.length }}</span>
          </div>
          <div v-for="item in phones" :key="item.id" class="inventory-item">
            <div class="item-top">
              <strong>{{ item.extension }} · {{ item.name }}</strong
              ><StatusBadge
                :status="item.status || (item.enabled ? 'Enabled' : 'Disabled')"
              />
            </div>
            <small>{{ item.model }} · SEP{{ item.macAddress }}</small>
            <div class="item-actions">
              <UButton
                label="Edit"
                color="primary"
                variant="soft"
                size="sm"
                type="button"
                @click="editPhone(item)"
              /><UButton
                label="Delete"
                color="error"
                variant="soft"
                size="sm"
                type="button"
                @click="removePhone(item.id)"
              />
            </div>
          </div>
          <p v-if="!phones.length" class="muted">No phones configured yet.</p>
        </section>
        <ProfileEditor @save="manager.saveProfile" />
      </div>
    </div>
  </AppShell>
</template>

<style scoped>
.page-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
  gap: 1rem;
}
.side-stack {
  display: grid;
  align-content: start;
  gap: 1rem;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section-heading h2 {
  margin: 0;
  font-size: 1.05rem;
}
.count {
  display: grid;
  place-items: center;
  min-width: 25px;
  height: 23px;
  border-radius: 99px;
  background: #edf2fa;
  color: #526176;
  font-size: 0.72rem;
  font-weight: 700;
}
.inventory-item {
  padding: 0.7rem 0;
  border-bottom: 1px solid #e5ebf2;
}
.item-top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: center;
}
.inventory-item small {
  display: block;
  color: #748198;
  margin-top: 0.25rem;
  font-size: 0.72rem;
}
.item-actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
}
@media (max-width: 1050px) {
  .page-grid {
    grid-template-columns: 1fr;
  }
}
</style>
