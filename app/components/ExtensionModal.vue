<script setup lang="ts">
import type { Extension, Phone } from '~/composables/useManagerData'

const props = defineProps<{ modelValue: boolean; value: Partial<Extension> & { secret?: string; phoneId?: string }; phones: Phone[]; saving?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; save: [value: Record<string, unknown>] }>()
const form = reactive<Record<string, unknown>>({})
watch(() => props.value, value => Object.assign(form, value), { immediate: true, deep: true })
function close() { emit('update:modelValue', false) }
</script>

<template>
  <div v-if="modelValue" class="modal-backdrop" @click.self="close">
    <form class="modal card grid" @submit.prevent="emit('save', { ...form })">
      <div class="modal-head"><div><span class="eyebrow">SIP account</span><h2>{{ form.id ? 'Edit extension' : 'Create extension' }}</h2></div><UButton icon="lucide:x" color="neutral" variant="ghost" aria-label="Close" @click="close" /></div>
      <p class="muted">Extensions can exist without a device. Assign a phone now or later.</p>
      <div class="grid two">
        <label>Extension number<input v-model="form.extension" inputmode="numeric" pattern="[0-9]{1,10}" required placeholder="e.g. 201"></label>
        <label>Name<input v-model="form.name" required placeholder="Sales desk"></label>
        <label>Display name<input v-model="form.displayName" placeholder="Shown on the phone"></label>
        <label>SIP username<input v-model="form.username" placeholder="Defaults to extension"></label>
        <label>SIP secret<input v-model="form.secret" :required="!form.id" type="password" placeholder="Leave blank to keep current"></label>
        <label class="check"><input v-model="form.enabled" type="checkbox"> Account enabled</label>
      </div>
      <label>Assign phone<select v-model="form.phoneId"><option value="">Leave unassigned</option><option v-for="item in phones" :key="item.id" :value="item.id">{{ item.name }} · {{ item.model }} · SEP{{ item.macAddress }}</option></select></label>
      <div class="modal-actions"><UButton label="Cancel" color="neutral" variant="soft" type="button" @click="close" /><UButton :label="saving ? 'Saving…' : form.id ? 'Save changes' : 'Create extension'" :loading="saving" type="submit" /></div>
    </form>
  </div>
</template>

<style scoped>
.modal-backdrop{position:fixed;inset:0;background:#101b2b80;display:grid;place-items:center;padding:1rem;z-index:20}.modal{width:min(580px,100%);max-height:calc(100vh - 2rem);overflow:auto}.modal-head{display:flex;justify-content:space-between;align-items:flex-start}.modal h2{margin:.2rem 0;font-size:1.3rem}.modal-actions{display:flex;justify-content:flex-end;gap:.5rem;margin-top:.4rem}.modal .check{margin-top:1.55rem}
</style>
