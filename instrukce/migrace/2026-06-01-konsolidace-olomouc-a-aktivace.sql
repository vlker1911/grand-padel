-- 2026-06-01: Konsolidace olomoucké pobočky pro /rezervace/dostupnost.
--
-- Stav před migrací:
--   pobocky.mesto='Olomouc' obsahuje 2 duplicitní záznamy:
--     A) dd2d9351-6167-4d81-aff5-79254bd958e0  (vytvořeno 2026-04-27)
--        - 7 kurtů (1..6 + Center Court)
--        - cenik: 5 řádků se SPRÁVNÝMI jednotkami (haléře, 80000 = 800 Kč)
--        - oteviraci_doba: 0 řádků
--     B) 11111111-0000-0000-0000-000000000001  (vytvořeno 2026-05-15, placeholder seed)
--        - 7 kurtů (Center kurt + 2..7)
--        - cenik: 5 řádků v Kč (špatné jednotky)
--        - oteviraci_doba: 7 řádků (každý den 7:00–23:00)
--   tabulky rezervace, blokace -> 0 řádků na obě pobočky => bezpečné smazat.
--
-- Cíl: zachovat A, převzít z B otevírací dobu, B smazat, A + její kurty aktivovat.

BEGIN;

-- 1) Migrovat otevírací dobu z B na A.
INSERT INTO oteviraci_doba (pobocka_id, den, otevreno_od, otevreno_do, je_aktivni)
SELECT 'dd2d9351-6167-4d81-aff5-79254bd958e0',
       den, otevreno_od, otevreno_do, je_aktivni
FROM oteviraci_doba
WHERE pobocka_id = '11111111-0000-0000-0000-000000000001';

-- 2) Vyčistit B (placeholder).
DELETE FROM kurty           WHERE pobocka_id = '11111111-0000-0000-0000-000000000001';
DELETE FROM cenik           WHERE pobocka_id = '11111111-0000-0000-0000-000000000001';
DELETE FROM oteviraci_doba  WHERE pobocka_id = '11111111-0000-0000-0000-000000000001';
DELETE FROM pobocky         WHERE id         = '11111111-0000-0000-0000-000000000001';

-- 3) Aktivovat zbývající pobočku A i její kurty.
UPDATE pobocky SET je_aktivni = TRUE WHERE id         = 'dd2d9351-6167-4d81-aff5-79254bd958e0';
UPDATE kurty   SET je_aktivni = TRUE WHERE pobocka_id = 'dd2d9351-6167-4d81-aff5-79254bd958e0';

COMMIT;
