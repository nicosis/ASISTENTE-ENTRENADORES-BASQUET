import { computed, ref, type Ref } from 'vue'
import { nextId, type Season, type WeeklyReview } from '~/composables/useCoachStorage'

export function useWeeklyReviews(params: {
  reviews: Ref<WeeklyReview[]>
  activeSeasonId: Ref<string>
  activeSeason: Ref<Season | undefined>
  displayedWeekStart: Ref<string>
  onSave: () => void
}) {
  const reviewDraft = ref('')
  const reviewEditorOpen = ref(false)
  const historyModalOpen = ref(false)
  const selectedHistoryReviewId = ref<string | null>(null)

  const activeWeekReview = computed(() =>
    params.reviews.value.find(
      (review) =>
        review.seasonId === params.activeSeasonId.value &&
        review.weekStart === params.displayedWeekStart.value,
    ),
  )

  const seasonReviews = computed(() =>
    params.reviews.value
      .filter((review) => review.seasonId === params.activeSeasonId.value)
      .sort((first, second) => second.weekStart.localeCompare(first.weekStart)),
  )

  const selectedHistoryReview = computed(
    () =>
      seasonReviews.value.find(
        (review) => review.id === selectedHistoryReviewId.value,
      ) ||
      activeWeekReview.value ||
      seasonReviews.value[0],
  )

  function openReviewEditor(): void {
    reviewDraft.value = activeWeekReview.value?.text || ''
    reviewEditorOpen.value = true
  }

  function closeReviewEditor(): void {
    reviewDraft.value = ''
    reviewEditorOpen.value = false
  }

  function saveReview(): void {
    if (!reviewDraft.value.trim() || !params.activeSeason.value) return
    const existing = activeWeekReview.value
    if (existing) {
      existing.text = reviewDraft.value.trim()
    } else {
      params.reviews.value.unshift({
        id: nextId(
          'OBS',
          params.reviews.value.map((item) => item.id),
        ),
        seasonId: params.activeSeason.value.id,
        weekStart: params.displayedWeekStart.value,
        text: reviewDraft.value.trim(),
        createdAt: new Date().toISOString(),
      })
    }
    reviewDraft.value = ''
    reviewEditorOpen.value = false
    params.onSave()
  }

  function openHistory(): void {
    selectedHistoryReviewId.value =
      activeWeekReview.value?.id || seasonReviews.value[0]?.id || null
    historyModalOpen.value = true
  }

  function closeHistory(): void {
    historyModalOpen.value = false
    selectedHistoryReviewId.value = null
  }

  return {
    reviewDraft,
    reviewEditorOpen,
    historyModalOpen,
    selectedHistoryReviewId,
    activeWeekReview,
    seasonReviews,
    selectedHistoryReview,
    openReviewEditor,
    closeReviewEditor,
    saveReview,
    openHistory,
    closeHistory,
  }
}
