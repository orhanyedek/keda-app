/**
 * KEDA - Veritabanı Yardımcı Fonksiyonları
 * Supabase CRUD işlemleri - tüm modüller bu dosyayı kullanır
 */

import { supabase } from "./supabase";

// ==================== FLASHCARD ====================

export async function getFlashcardSets(userId: string) {
  const { data, error } = await supabase
    .from("flashcard_sets")
    .select("*, flashcards(count)")
    .eq("kullanici_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function createFlashcardSet(userId: string, baslik: string) {
  const { data, error } = await supabase
    .from("flashcard_sets")
    .insert({ kullanici_id: userId, baslik })
    .select()
    .single();
  return { data, error };
}

export async function saveFlashcards(
  userId: string,
  setId: string,
  cards: { soru: string; cevap: string; zorluk: number }[]
) {
  const rows = cards.map((c) => ({
    kullanici_id: userId,
    set_id: setId,
    soru: c.soru,
    cevap: c.cevap,
    zorluk: c.zorluk || 3,
    kutu_no: 1,
    sonraki_gosterim: new Date().toISOString(),
  }));
  const { data, error } = await supabase.from("flashcards").insert(rows).select();
  return { data, error };
}

export async function getDueFlashcards(userId: string) {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("kullanici_id", userId)
    .lte("sonraki_gosterim", new Date().toISOString())
    .order("kutu_no", { ascending: true });
  return { data, error };
}

// Leitner algoritması - sonraki gösterim tarihini hesapla
const leitnerIntervals = [0, 1, 3, 7, 14]; // gün cinsinden (kutu 1-5)

export async function updateFlashcardResult(
  cardId: string,
  correct: boolean,
  currentBox: number
) {
  const newBox = correct ? Math.min(currentBox + 1, 5) : 1;
  const intervalDays = leitnerIntervals[newBox - 1];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);

  // Önce mevcut sayaçları oku
  const { data: card } = await supabase
    .from("flashcards")
    .select("dogru_sayisi, yanlis_sayisi")
    .eq("id", cardId)
    .single();

  const { error } = await supabase
    .from("flashcards")
    .update({
      kutu_no: newBox,
      sonraki_gosterim: nextDate.toISOString(),
      dogru_sayisi: correct ? (card?.dogru_sayisi || 0) + 1 : card?.dogru_sayisi || 0,
      yanlis_sayisi: !correct ? (card?.yanlis_sayisi || 0) + 1 : card?.yanlis_sayisi || 0,
    })
    .eq("id", cardId);
  return { error };
}

// ==================== ÇALIŞMA PLANI ====================

export async function getStudyPlans(userId: string) {
  const { data, error } = await supabase
    .from("study_plans")
    .select("*, topics(*)")
    .eq("kullanici_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function saveStudyPlan(
  userId: string,
  plan: {
    baslik?: string;
    hedef_gun_sayisi: number;
    musait_olmayan_gunler: number[];
    topics: { baslik: string; zorluk_seviyesi: number; hedef_gun: number; tahmini_sure_dk: number }[];
  }
) {
  // Önce planı kaydet
  const { data: planData, error: planError } = await supabase
    .from("study_plans")
    .insert({
      kullanici_id: userId,
      baslik: plan.baslik || "Çalışma Planı",
      hedef_gun_sayisi: plan.hedef_gun_sayisi,
      musait_olmayan_gunler: plan.musait_olmayan_gunler,
      durum: "aktif",
    })
    .select()
    .single();

  if (planError || !planData) return { data: null, error: planError };

  // Sonra konuları kaydet
  const topicRows = plan.topics.map((t) => ({
    plan_id: planData.id,
    kullanici_id: userId,
    baslik: t.baslik,
    zorluk_seviyesi: t.zorluk_seviyesi,
    hedef_gun: t.hedef_gun,
    tahmini_sure_dk: t.tahmini_sure_dk,
    tamamlandi_mi: false,
  }));

  const { error: topicsError } = await supabase.from("topics").insert(topicRows);
  return { data: planData, error: topicsError };
}

export async function markTopicDone(topicId: string, done: boolean) {
  const { error } = await supabase
    .from("topics")
    .update({ tamamlandi_mi: done })
    .eq("id", topicId);
  return { error };
}

// ==================== PODCAST ====================

export async function getPodcasts(userId: string) {
  const { data, error } = await supabase
    .from("podcasts")
    .select("*")
    .eq("kullanici_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function savePodcast(
  userId: string,
  podcast: {
    baslik: string;
    diyalog_metni: string;
  }
) {
  const { data, error } = await supabase
    .from("podcasts")
    .insert({
      kullanici_id: userId,
      baslik: podcast.baslik,
      diyalog_metni: podcast.diyalog_metni,
      durum: "hazır",
    })
    .select()
    .single();
  return { data, error };
}

// ==================== DASHBOARD İSTATİSTİKLERİ ====================

export async function getDashboardStats(userId: string) {
  const [flashcardsRes, plansRes, podcastsRes] = await Promise.all([
    supabase
      .from("flashcards")
      .select("id, kutu_no, sonraki_gosterim")
      .eq("kullanici_id", userId),
    supabase
      .from("study_plans")
      .select("*, topics(*)")
      .eq("kullanici_id", userId)
      .eq("durum", "aktif")
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("podcasts")
      .select("*")
      .eq("kullanici_id", userId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const now = new Date().toISOString();
  const dueCards = (flashcardsRes.data || []).filter(
    (c) => c.sonraki_gosterim <= now
  );

  return {
    toplam_flashcard: flashcardsRes.data?.length || 0,
    bugun_tekrar_edilecek: dueCards.length,
    aktif_plan: plansRes.data?.[0] || null,
    son_podcast: podcastsRes.data?.[0] || null,
  };
}

// ==================== FLASHCARD SET DETAY ====================
export async function getFlashcardsBySet(setId: string) {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("set_id", setId)
    .order("created_at", { ascending: true });
  return { data, error };
}

// ==================== İSTATİSTİKLER ====================
export async function getDetailedStats(userId: string) {
  const [flashcardsRes, setsRes, plansRes, podcastsRes] = await Promise.all([
    supabase.from("flashcards").select("id, kutu_no, dogru_sayisi, yanlis_sayisi, created_at").eq("kullanici_id", userId),
    supabase.from("flashcard_sets").select("id, created_at").eq("kullanici_id", userId),
    supabase.from("study_plans").select("id, durum, created_at, topics(id, tamamlandi_mi)").eq("kullanici_id", userId),
    supabase.from("podcasts").select("id, created_at").eq("kullanici_id", userId),
  ]);

  const flashcards = flashcardsRes.data || [];
  const sets = setsRes.data || [];
  const plans = plansRes.data || [];
  const podcasts = podcastsRes.data || [];

  const totalCorrect = flashcards.reduce((s, c) => s + (c.dogru_sayisi || 0), 0);
  const totalWrong = flashcards.reduce((s, c) => s + (c.yanlis_sayisi || 0), 0);
  const totalAnswered = totalCorrect + totalWrong;
  const successRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  // Kutu dağılımı
  const boxDist = [1, 2, 3, 4, 5].map(box => ({
    box,
    count: flashcards.filter(c => c.kutu_no === box).length,
  }));

  // Son 7 günlük aktivite
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return {
      label: d.toLocaleDateString("tr-TR", { weekday: "short" }),
      flashcards: flashcards.filter(c => {
        const cd = new Date(c.created_at);
        return cd >= d && cd < next;
      }).length,
    };
  });

  // Tamamlanan konular
  const allTopics = plans.flatMap((p: { topics: { tamamlandi_mi: boolean }[] }) => p.topics || []);
  const completedTopics = allTopics.filter((t: { tamamlandi_mi: boolean }) => t.tamamlandi_mi).length;

  return {
    toplam_flashcard: flashcards.length,
    toplam_set: sets.length,
    toplam_plan: plans.length,
    toplam_podcast: podcasts.length,
    dogru_sayisi: totalCorrect,
    yanlis_sayisi: totalWrong,
    basari_orani: successRate,
    kutu_dagilimi: boxDist,
    haftalik_aktivite: last7,
    tamamlanan_konu: completedTopics,
    toplam_konu: allTopics.length,
  };
}

// ==================== FLASHCARD DÜZENLE/SİL ====================
export async function updateFlashcard(id: string, soru: string, cevap: string) {
  const { error } = await supabase.from("flashcards").update({ soru, cevap }).eq("id", id);
  return { error };
}

export async function deleteFlashcard(id: string) {
  const { error } = await supabase.from("flashcards").delete().eq("id", id);
  return { error };
}

export async function deleteFlashcardSet(id: string, userId: string) {
  await supabase.from("flashcards").delete().eq("set_id", id).eq("kullanici_id", userId);
  const { error } = await supabase.from("flashcard_sets").delete().eq("id", id);
  return { error };
}

// ==================== PLAN DÜZENLE ====================
export async function deleteStudyPlan(id: string) {
  await supabase.from("topics").delete().eq("plan_id", id);
  const { error } = await supabase.from("study_plans").delete().eq("id", id);
  return { error };
}

// ==================== PODCAST DÜZENLE/SİL ====================
export async function deletePodcast(id: string) {
  const { error } = await supabase.from("podcasts").delete().eq("id", id);
  return { error };
}
