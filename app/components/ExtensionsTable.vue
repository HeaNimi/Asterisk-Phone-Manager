<script setup lang="ts">
import type { Extension } from "~/composables/useManagerData";

defineProps<{ items: Extension[] }>();
const emit = defineEmits<{
  edit: [extension: Extension];
  remove: [id: string];
}>();
</script>

<template>
  <div v-if="items.length" class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Status</th>
          <th>Extension</th>
          <th>Name</th>
          <th>Assigned phone</th>
          <th>Model</th>
          <th>Configuration</th>
          <th><span class="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td><StatusBadge :status="item.status" /></td>
          <td>
            <strong class="extension-number">{{ item.extension }}</strong>
          </td>
          <td>
            <strong>{{ item.displayName || item.name }}</strong
            ><small>{{ item.displayName ? item.name : "SIP account" }}</small>
          </td>
          <td>
            <template v-if="item.phone"
              ><strong>{{ item.phone.name }}</strong
              ><small>SEP{{ item.phone.macAddress }}</small></template
            ><span v-else class="muted">No phone assigned</span>
          </td>
          <td>{{ item.phone?.model || "—" }}</td>
          <td>
            <span>{{ item.configState }}</span
            ><small>Network status not monitored</small>
          </td>
          <td>
            <div class="row-actions">
              <UButton
                label="Edit"
                color="primary"
                variant="link"
                size="xs"
                @click="emit('edit', item)"
              /><UButton
                label="Delete"
                color="error"
                variant="link"
                size="xs"
                @click="emit('remove', item.id)"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="empty-state">
    <span class="empty-mark" aria-hidden="true"
      ><Icon name="lucide:phone-off" size="18"
    /></span>
    <h3>No extensions match</h3>
    <p class="muted">Try changing your search or filter.</p>
  </div>
</template>

<style scoped>
.table-wrap {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 820px;
}
th {
  text-align: left;
  color: #71809a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.62rem;
  font-weight: 750;
  background: #fbfcfe;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid #e3e9f1;
}
td {
  padding: 0.8rem 1rem;
  border-bottom: 1px solid #edf1f5;
  color: #334155;
  font-size: 0.78rem;
  vertical-align: middle;
}
td strong,
td small {
  display: block;
}
td small {
  color: #8290a5;
  font-size: 0.7rem;
  margin-top: 0.18rem;
}
.extension-number {
  font-variant-numeric: tabular-nums;
  font-size: 0.92rem;
  color: #315fae;
}
.row-actions {
  display: flex;
  gap: 0.4rem;
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
}
.empty-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  margin: 0 auto 0.7rem;
  border-radius: 50%;
  background: #edf2fa;
  color: #4779d8;
}
.empty-state h3 {
  margin: 0.25rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
