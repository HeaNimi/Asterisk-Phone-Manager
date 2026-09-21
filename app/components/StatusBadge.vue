<script setup lang="ts">
const props = defineProps<{ status: 'Enabled' | 'Disabled' | 'Unassigned' | string }>()
const tone = computed(() => props.status.toLowerCase())
</script>

<template>
  <UBadge :label="status" :color="tone === 'enabled' ? 'success' : tone === 'disabled' ? 'error' : 'warning'" variant="subtle" />
</template>
