<?php
/**
 * 2026-11-11 — Courbe secp256k1 en PHP pur (Ethereum, BNB, Polygon, Base, Arbitrum…).
 * Pourquoi : OpenSSL (seul outil sûr présent sur le serveur) signe toujours SHA-256(message) ; Ethereum exige une
 * signature d'un résumé Keccak-256 déjà calculé → impossible avec OpenSSL. Ce fichier signe un résumé de 32 octets
 * (ECDSA, nonce déterministe RFC 6979, « s bas », numéro de récupération), comme ethers.js / noble-secp256k1.
 * Grands nombres : tableaux de « chiffres » de 16 bits (petit-boutiste). Vérifié contre ethers.js (scripts/test-coffre-ec.php).
 */

const CEC_P_HEX = 'fffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f';
const CEC_N_HEX = 'fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141';
const CEC_GX_HEX = '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
const CEC_GY_HEX = '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8';

function cec_from_hex(string $hex): array {
  $hex = ltrim(strtolower($hex), '0');
  if ($hex === '') return [0];
  $hex = str_pad($hex, (int) (ceil(strlen($hex) / 4) * 4), '0', STR_PAD_LEFT);
  $out = [];
  for ($i = strlen($hex); $i > 0; $i -= 4) $out[] = hexdec(substr($hex, $i - 4, 4));
  return cec_norm($out);
}

function cec_to_hex(array $a, int $bytes = 32): string {
  $a = cec_norm($a);
  $h = '';
  for ($i = count($a) - 1; $i >= 0; $i--) $h .= str_pad(dechex($a[$i]), 4, '0', STR_PAD_LEFT);
  $h = ltrim($h, '0');
  return $bytes > 0 ? str_pad($h, $bytes * 2, '0', STR_PAD_LEFT) : ($h === '' ? '0' : $h);
}

function cec_from_bin(string $b): array { return cec_from_hex(bin2hex($b)); }
function cec_to_bin(array $a, int $bytes = 32): string { return hex2bin(cec_to_hex($a, $bytes)); }

/** Enlève les zéros de tête (garde au moins un chiffre). */
function cec_norm(array $a): array {
  $n = count($a);
  while ($n > 1 && $a[$n - 1] === 0) { array_pop($a); $n--; }
  return $a ?: [0];
}

function cec_is_zero(array $a): bool { $a = cec_norm($a); return count($a) === 1 && $a[0] === 0; }

function cec_cmp(array $a, array $b): int {
  $a = cec_norm($a); $b = cec_norm($b);
  $na = count($a); $nb = count($b);
  if ($na !== $nb) return $na < $nb ? -1 : 1;
  for ($i = $na - 1; $i >= 0; $i--) if ($a[$i] !== $b[$i]) return $a[$i] < $b[$i] ? -1 : 1;
  return 0;
}

function cec_add(array $a, array $b): array {
  $n = max(count($a), count($b)); $out = []; $c = 0;
  for ($i = 0; $i < $n; $i++) { $v = ($a[$i] ?? 0) + ($b[$i] ?? 0) + $c; $out[] = $v & 0xFFFF; $c = $v >> 16; }
  if ($c) $out[] = $c;
  return cec_norm($out);
}

/** a − b (a ≥ b obligatoire). */
function cec_sub(array $a, array $b): array {
  $out = []; $br = 0; $n = count($a);
  for ($i = 0; $i < $n; $i++) { $v = $a[$i] - ($b[$i] ?? 0) - $br; if ($v < 0) { $v += 0x10000; $br = 1; } else $br = 0; $out[] = $v; }
  return cec_norm($out);
}

function cec_mul(array $a, array $b): array {
  $na = count($a); $nb = count($b);
  $t = array_fill(0, $na + $nb, 0);
  for ($i = 0; $i < $na; $i++) {
    $ai = $a[$i]; if ($ai === 0) continue;
    for ($j = 0; $j < $nb; $j++) $t[$i + $j] += $ai * $b[$j];
    if (($i & 7) === 7) { $c = 0; for ($k = 0, $m = $na + $nb; $k < $m; $k++) { $v = $t[$k] + $c; $t[$k] = $v & 0xFFFF; $c = $v >> 16; } }
  }
  $c = 0;
  for ($k = 0, $m = $na + $nb; $k < $m; $k++) { $v = $t[$k] + $c; $t[$k] = $v & 0xFFFF; $c = $v >> 16; }
  return cec_norm($t);
}

/** Réduction modulo m = 2^256 − c (vrai pour p et pour n de secp256k1) : 2^256 ≡ c. */
function cec_mod_special(array $x, array $m, array $c): array {
  $x = cec_norm($x);
  while (count($x) > 16) {
    $lo = array_slice($x, 0, 16);
    $hi = array_slice($x, 16);
    $x = cec_add(cec_norm($lo), cec_mul(cec_norm($hi), $c));
  }
  while (cec_cmp($x, $m) >= 0) $x = cec_sub($x, $m);
  return $x;
}

function cec_P(): array { static $v = null; return $v ??= cec_from_hex(CEC_P_HEX); }
function cec_N(): array { static $v = null; return $v ??= cec_from_hex(CEC_N_HEX); }
function cec_CP(): array { static $v = null; return $v ??= cec_from_hex('1000003d1'); }                         // 2^256 − p
function cec_CN(): array { static $v = null; return $v ??= cec_from_hex('14551231950b75fc4402da1732fc9bebf'); }  // 2^256 − n

function cec_fmul(array $a, array $b): array { return cec_mod_special(cec_mul($a, $b), cec_P(), cec_CP()); }
function cec_fadd(array $a, array $b): array { return cec_mod_special(cec_add($a, $b), cec_P(), cec_CP()); }
function cec_fsub(array $a, array $b): array { return cec_cmp($a, $b) >= 0 ? cec_sub($a, $b) : cec_sub(cec_add($a, cec_P()), $b); }
function cec_nmul(array $a, array $b): array { return cec_mod_special(cec_mul($a, $b), cec_N(), cec_CN()); }

/** a^e mod m (m = p ou n). */
function cec_pow(array $a, array $e, bool $isN): array {
  $r = [1];
  $hex = cec_to_hex($e, 0);
  $bits = '';
  foreach (str_split($hex) as $h) $bits .= str_pad(decbin(hexdec($h)), 4, '0', STR_PAD_LEFT);
  $bits = ltrim($bits, '0');
  $mul = $isN ? 'cec_nmul' : 'cec_fmul';
  for ($i = 0, $L = strlen($bits); $i < $L; $i++) {
    $r = $mul($r, $r);
    if ($bits[$i] === '1') $r = $mul($r, $a);
  }
  return $r;
}

function cec_finv(array $a): array { return cec_pow($a, cec_sub(cec_P(), [2]), false); }
function cec_ninv(array $a): array { return cec_pow($a, cec_sub(cec_N(), [2]), true); }

/* Points en coordonnées jacobiennes [X, Y, Z] ; null = point à l'infini. */
function cec_dbl(?array $P): ?array {
  if ($P === null || cec_is_zero($P[1])) return null;
  [$X1, $Y1, $Z1] = $P;
  $A = cec_fmul($X1, $X1); $B = cec_fmul($Y1, $Y1); $C = cec_fmul($B, $B);
  $t = cec_fadd($X1, $B); $D = cec_fsub(cec_fsub(cec_fmul($t, $t), $A), $C); $D = cec_fadd($D, $D);
  $E = cec_fadd(cec_fadd($A, $A), $A); $F = cec_fmul($E, $E);
  $X3 = cec_fsub($F, cec_fadd($D, $D));
  $C8 = cec_fadd($C, $C); $C8 = cec_fadd($C8, $C8); $C8 = cec_fadd($C8, $C8);
  $Y3 = cec_fsub(cec_fmul($E, cec_fsub($D, $X3)), $C8);
  $Z3 = cec_fmul(cec_fadd($Y1, $Y1), $Z1);
  return [$X3, $Y3, $Z3];
}

function cec_addp(?array $P, ?array $Q): ?array {
  if ($P === null) return $Q;
  if ($Q === null) return $P;
  [$X1, $Y1, $Z1] = $P; [$X2, $Y2, $Z2] = $Q;
  $Z1Z1 = cec_fmul($Z1, $Z1); $Z2Z2 = cec_fmul($Z2, $Z2);
  $U1 = cec_fmul($X1, $Z2Z2); $U2 = cec_fmul($X2, $Z1Z1);
  $S1 = cec_fmul(cec_fmul($Y1, $Z2), $Z2Z2); $S2 = cec_fmul(cec_fmul($Y2, $Z1), $Z1Z1);
  $H = cec_fsub($U2, $U1); $rr = cec_fsub($S2, $S1);
  if (cec_is_zero($H)) return cec_is_zero($rr) ? cec_dbl($P) : null;
  $H2 = cec_fadd($H, $H); $I = cec_fmul($H2, $H2); $J = cec_fmul($H, $I);
  $rr = cec_fadd($rr, $rr); $V = cec_fmul($U1, $I);
  $X3 = cec_fsub(cec_fsub(cec_fmul($rr, $rr), $J), cec_fadd($V, $V));
  $SJ = cec_fmul($S1, $J);
  $Y3 = cec_fsub(cec_fmul($rr, cec_fsub($V, $X3)), cec_fadd($SJ, $SJ));
  $Zs = cec_fadd($Z1, $Z2);
  $Z3 = cec_fmul(cec_fsub(cec_fsub(cec_fmul($Zs, $Zs), $Z1Z1), $Z2Z2), $H);
  return [$X3, $Y3, $Z3];
}

function cec_mulG(array $k): ?array {
  $G = [cec_from_hex(CEC_GX_HEX), cec_from_hex(CEC_GY_HEX), [1]];
  $R = null;
  $hex = cec_to_hex($k, 32);
  for ($i = 0; $i < 64; $i++) {
    $nib = hexdec($hex[$i]);
    for ($b = 3; $b >= 0; $b--) {
      $R = cec_dbl($R);
      if (($nib >> $b) & 1) $R = cec_addp($R, $G);
    }
  }
  return $R;
}

/** Jacobien → affine [x, y]. */
function cec_affine(?array $P): ?array {
  if ($P === null) return null;
  $zi = cec_finv($P[2]); $zi2 = cec_fmul($zi, $zi);
  return [cec_fmul($P[0], $zi2), cec_fmul($P[1], cec_fmul($zi2, $zi))];
}

/** Clé publique non compressée (64 octets x‖y) d'une clé privée de 32 octets. */
function cec_pub(string $priv32): string {
  $A = cec_affine(cec_mulG(cec_from_bin($priv32)));
  return cec_to_bin($A[0]) . cec_to_bin($A[1]);
}

/**
 * Signe un résumé de 32 octets. Retour : ['r' => 32 o, 's' => 32 o, 'v' => 0|1] (s bas, comme Ethereum l'exige).
 * Nonce déterministe RFC 6979 (HMAC-SHA256) : même clé + même résumé = même signature, jamais de nonce faible.
 */
function cec_sign(string $digest32, string $priv32): array {
  $N = cec_N();
  $d = cec_from_bin($priv32);
  if (cec_is_zero($d) || cec_cmp($d, $N) >= 0 || strlen($digest32) !== 32) throw new RuntimeException('clé ou résumé invalide');
  $z = cec_from_bin($digest32);
  if (cec_cmp($z, $N) >= 0) $z = cec_sub($z, $N);
  $x = cec_to_bin($d); $h1 = cec_to_bin($z);
  $V = str_repeat("\x01", 32); $K = str_repeat("\x00", 32);
  $K = hash_hmac('sha256', $V . "\x00" . $x . $h1, $K, true); $V = hash_hmac('sha256', $V, $K, true);
  $K = hash_hmac('sha256', $V . "\x01" . $x . $h1, $K, true); $V = hash_hmac('sha256', $V, $K, true);
  for ($tries = 0; $tries < 100; $tries++) {
    $V = hash_hmac('sha256', $V, $K, true);
    $k = cec_from_bin($V);
    if (!cec_is_zero($k) && cec_cmp($k, $N) < 0) {
      $R = cec_affine(cec_mulG($k));
      if ($R !== null) {
        $r = $R[0]; $over = cec_cmp($r, $N) >= 0;
        if ($over) $r = cec_sub($r, $N);
        if (!cec_is_zero($r)) {
          $s = cec_nmul(cec_ninv($k), cec_mod_special(cec_add($z, cec_nmul($r, $d)), $N, cec_CN()));
          if (!cec_is_zero($s)) {
            $v = ($R[1][0] & 1) | ($over ? 2 : 0);
            $half = cec_from_hex('7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0');
            if (cec_cmp($s, $half) > 0) { $s = cec_sub($N, $s); $v ^= 1; }
            return ['r' => cec_to_bin($r), 's' => cec_to_bin($s), 'v' => $v];
          }
        }
      }
    }
    $K = hash_hmac('sha256', $V . "\x00", $K, true); $V = hash_hmac('sha256', $V, $K, true);
  }
  throw new RuntimeException('signature impossible');
}
