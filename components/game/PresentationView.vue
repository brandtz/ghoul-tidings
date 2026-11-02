<script setup lang="ts">
import { computed } from 'vue'
import { usePartyStore } from '~/stores/party'

const store = usePartyStore()
const p = computed(() => store.snap!.presentation!)
</script>

<template>
  <div style="width:100%;height:100%;display:flex;flex-direction:column;padding:14px;box-sizing:border-box;gap:8px">
    <div style="flex:1;min-height:0"><PdfSlide :deck-id="p.id" :page="p.page" /></div>
    <div class="chip" style="text-align:right">{{ p.page }} / {{ p.pageCount }}</div>
  </div>
</template>
