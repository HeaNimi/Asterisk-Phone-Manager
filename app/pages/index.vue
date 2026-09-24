<script setup lang="ts">
import type { Extension } from "~/composables/useManagerData";
import { emptyPhone } from "~/composables/useManagerData";

const manager = useManagerData();
const { extensions, phones } = manager;
const extensionQuery = ref("");
const extensionFilter = ref<"all" | "enabled" | "disabled" | "unassigned">(
  "all",
);
const extensionModal = ref(false);
const extensionSaving = ref(false);
const extensionForm = reactive<Record<string, unknown>>({});

const filteredExtensions = computed(() =>
  extensions.value.filter((item) => {
    const query = extensionQuery.value.trim().toLowerCase();
    const matchesQuery =
      !query ||
      [
        item.extension,
        item.name,
        item.displayName,
        item.phone?.name,
        item.phone?.macAddress,
      ].some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(query),
      );
    const matchesFilter =
      extensionFilter.value === "all" ||
      item.status.toLowerCase() === extensionFilter.value;
    return matchesQuery && matchesFilter;
  }),
);

function newExtension() {
  Object.assign(extensionForm, {
    id: "",
    extension: "",
    name: "",
    displayName: "",
    secret: "",
    username: "",
    enabled: true,
    phoneId: "",
  });
  extensionModal.value = true;
}
function editExtension(value: Extension) {
  Object.assign(extensionForm, {
    ...value,
    secret: "",
    phoneId: value.phone?.id || "",
  });
  extensionModal.value = true;
}
async function saveExtension(value: Record<string, unknown>) {
  extensionSaving.value = true;
  try {
    await manager.saveExtension(value);
    extensionModal.value = false;
  } finally {
    extensionSaving.value = false;
  }
}
async function deleteExtension(id: string) {
  if (confirm("Delete this extension account?"))
    await manager.deleteExtension(id);
}
onMounted(manager.load);
</script>

<template>
  <AppShell>
    <section class="hero-row">
      <div>
        <p class="eyebrow">Devices and users</p>
        <h2>Manage your extensions</h2>
        <p class="muted">
          Create SIP accounts first, then assign phones when they are ready.
        </p>
      </div>
      <div class="hero-actions">
        <UButton
          to="/phones"
          icon="lucide:phone-call"
          label="Add phone"
          color="neutral"
          variant="soft"
        /><UButton
          icon="lucide:plus"
          label="Add extension"
          @click="newExtension"
        />
      </div>
    </section>
    <div class="stat-grid">
      <div class="stat-card">
        <span class="stat-icon blue"
          ><Icon name="lucide:phone-call" size="16" aria-hidden="true"
        /></span>
        <div>
          <strong>{{ extensions.length }}</strong
          ><small>Total extensions</small>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon green"
          ><Icon name="lucide:check-circle-2" size="16" aria-hidden="true"
        /></span>
        <div>
          <strong>{{
            extensions.filter((item) => item.status === "Enabled").length
          }}</strong
          ><small>Enabled accounts</small>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon amber"
          ><Icon name="lucide:unlink" size="16" aria-hidden="true"
        /></span>
        <div>
          <strong>{{
            extensions.filter((item) => item.status === "Unassigned").length
          }}</strong
          ><small>Unassigned</small>
        </div>
      </div>
      <div class="stat-card">
        <span class="stat-icon slate"
          ><Icon name="lucide:phone" size="16" aria-hidden="true"
        /></span>
        <div>
          <strong>{{ phones.length }}</strong
          ><small>Phones in inventory</small>
        </div>
      </div>
    </div>
    <section class="card table-card">
      <div class="table-toolbar">
        <div>
          <h2>Extension overview</h2>
          <p class="muted">Accounts, assignments and configuration state</p>
        </div>
        <div class="filters">
          <label class="search"
            ><Icon name="lucide:search" size="15" aria-hidden="true" /><input
              v-model="extensionQuery"
              aria-label="Search extensions"
              placeholder="Search extensions" /></label
          ><select v-model="extensionFilter" aria-label="Filter extensions">
            <option value="all">All status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>
      <ExtensionsTable
        :items="filteredExtensions"
        @edit="editExtension"
        @remove="deleteExtension"
      />
    </section>
    <ExtensionModal
      v-model="extensionModal"
      :value="extensionForm"
      :phones="phones"
      :saving="extensionSaving"
      @save="saveExtension"
    />
  </AppShell>
</template>

<style scoped>
.hero-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin: 0.4rem 0 1.35rem;
}
.hero-row h2 {
  font-size: 1.55rem;
  margin: 0.25rem 0;
}
.hero-row p {
  margin: 0.3rem 0;
}
.hero-actions {
  display: flex;
  gap: 0.5rem;
  white-space: nowrap;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.8rem;
  margin-bottom: 1rem;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.9rem;
  background: #fff;
  border: 1px solid #dfe6ef;
  border-radius: 9px;
}
.stat-card strong,
.stat-card small {
  display: block;
}
.stat-card strong {
  font-size: 1.3rem;
}
.stat-card small {
  margin-top: 0.12rem;
  color: #6f7c91;
  font-size: 0.7rem;
}
.stat-icon {
  display: grid;
  place-items: center;
  width: 33px;
  height: 33px;
  border-radius: 8px;
  font-size: 0.62rem;
  font-weight: 800;
}
.stat-icon.blue {
  background: #eaf1ff;
  color: #356dcc;
}
.stat-icon.green {
  background: #e9f7ef;
  color: #216a43;
}
.stat-icon.amber {
  background: #fff6df;
  color: #9a680c;
}
.stat-icon.slate {
  background: #edf1f6;
  color: #526176;
}
.table-card {
  padding: 0;
  overflow: hidden;
}
.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.15rem;
  border-bottom: 1px solid #e3e9f1;
}
.table-toolbar h2 {
  margin: 0;
  font-size: 1rem;
}
.table-toolbar p {
  margin: 0.25rem 0 0;
}
.filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.filters select {
  width: auto;
  min-width: 120px;
}
.search {
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 0.25rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding-left: 0.55rem;
  background: #fff;
}
.search input {
  width: 165px;
  border: 0;
  padding: 0.5rem 0.35rem;
}
.search input:focus {
  outline: none;
}
@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 650px) {
  .hero-row,
  .table-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }
  .hero-actions {
    width: 100%;
  }
  .table-toolbar {
    padding: 0.85rem;
  }
  .filters {
    width: 100%;
  }
  .filters select,
  .search {
    flex: 1;
  }
  .search input {
    width: 100%;
  }
}
</style>
