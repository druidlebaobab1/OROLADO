// OROLADO — calibration et preuve du jeu équitable.
// Lancer : powershell -ExecutionPolicy Bypass -File scripts/fair-calib.ps1
// 1) Calcule les lignes objectif (strike / ×5 / ×10 / ×50) de chaque actif et durée.
// 2) Rejoue des millions de trades avec le MÊME générateur que le serveur (centimes entiers)
//    et mesure le retour joueur réel (objectif : 94 %).
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

public static class FairCalib
{
    public const int TICK_MS = 250;
    public static readonly int[] DURATIONS = { 5, 10, 30, 60, 300, 600 };
    public static readonly double[] MULTS = { 1.88, 5, 10, 50 };
    public const double RTP = 0.94;

    public class Asset
    {
        public string Id; public double Base; public double Sigma; public double Drift;
        public double JumpP; public double JumpMin; public double JumpMax; public int JumpDir;
        public Asset(string id, double b, double s) { Id = id; Base = b; Sigma = s; }
    }

    // Doit rester identique à feed_lib.php (orolado_feed_assets) et js/fair.js.
    public static List<Asset> Assets()
    {
        var a = new List<Asset>();
        a.Add(new Asset("v100", 13000.42, 0.00020));
        a.Add(new Asset("stable", 10000.00, 0.0001125));
        a.Add(new Asset("apex500", 5480.25, 0.00036));
        a.Add(new Asset("horizon50", 10120.40, 0.00009) { Drift = -0.0000043, JumpP = 1.0 / 700, JumpMin = 0.002, JumpMax = 0.004, JumpDir = 1 });
        a.Add(new Asset("goldtrend", 7340.80, 0.000195));
        a.Add(new Asset("v75", 8700.18, 0.000256));
        a.Add(new Asset("nexusprime", 8120.60, 0.00027));
        a.Add(new Asset("titanpulse", 9560.40, 0.00084));
        a.Add(new Asset("boomspike", 3890.20, 0.00012));
        a.Add(new Asset("crash300", 4210.55, 0.00022));
        return a;
    }

    // Probabilités de gain visées : RTP / multiplicateur (1.88 → 50 %).
    public static double TargetP(double mult) { return mult < 2 ? 0.5 : RTP / mult; }

    static double InvNorm(double p)
    {
        double[] a = { -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577509590705e+02, -3.066479806614716e+01, 2.506628277459239e+00 };
        double[] b = { -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01 };
        double[] c = { -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00 };
        double[] d = { 7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00 };
        double q, r;
        if (p < 0.02425) { q = Math.Sqrt(-2 * Math.Log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
        if (p > 1 - 0.02425) { q = Math.Sqrt(-2 * Math.Log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
        q = p - 0.5; r = q * q;
        return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }

    // RNG rapide et reproductible (xoshiro256**) pour la simulation.
    public class Rng
    {
        ulong s0, s1, s2, s3;
        public Rng(ulong seed) { s0 = Mix(ref seed); s1 = Mix(ref seed); s2 = Mix(ref seed); s3 = Mix(ref seed); }
        static ulong Mix(ref ulong x) { x += 0x9E3779B97F4A7C15UL; ulong z = x; z = (z ^ (z >> 30)) * 0xBF58476D1CE4E5B9UL; z = (z ^ (z >> 27)) * 0x94D049BB133111EBUL; return z ^ (z >> 31); }
        static ulong Rotl(ulong x, int k) { return (x << k) | (x >> (64 - k)); }
        public ulong Next() { ulong r = Rotl(s1 * 5, 7) * 9; ulong t = s1 << 17; s2 ^= s0; s3 ^= s1; s1 ^= s2; s0 ^= s3; s2 ^= t; s3 = Rotl(s3, 45); return r; }
        public double U() { return ((Next() >> 11) + 0.5) / 9007199254740992.0; }
        bool has; double spare;
        public double Z() { if (has) { has = false; return spare; } double u = U(), v = U(); double m = Math.Sqrt(-2 * Math.Log(u)); spare = m * Math.Sin(2 * Math.PI * v); has = true; return m * Math.Cos(2 * Math.PI * v); }
    }

    // Un tick du générateur serveur, en centimes entiers (copie exacte de feed_lib.php).
    // Même « élastique » que feed_lib.php (orolado_feed_pull, bande 0,35).
    public const double PriceBand = 0.35;
    public static double Pull(Asset a)
    {
        double v = a.Sigma * a.Sigma;
        if (a.JumpP > 0) v += a.JumpP * (a.JumpMin * a.JumpMin + a.JumpMin * a.JumpMax + a.JumpMax * a.JumpMax) / 3.0;
        return v / (2.0 * PriceBand * PriceBand);
    }

    public static long Step(Asset a, long cents, Rng r)
    {
        double rel = a.Sigma * r.Z() + a.Drift;
        if (cents > 0 && a.Base > 0) rel -= Pull(a) * Math.Log(cents / (a.Base * 100.0));
        if (a.JumpP > 0 && r.U() < a.JumpP) rel += a.JumpDir * (a.JumpMin + (a.JumpMax - a.JumpMin) * r.U());
        long d = (long)Math.Round(cents * rel, MidpointRounding.AwayFromZero);
        long next = cents + d;
        return next < 100 ? 100 : next;
    }

    // Quantiles du mouvement relatif sur n ticks : échantillonnage direct (somme exacte).
    static double[] SampleMoves(Asset a, int n, int samples, Rng r)
    {
        var res = new double[samples];
        double sd = a.Sigma * Math.Sqrt(n);
        double lam = a.JumpP * n;
        for (int i = 0; i < samples; i++)
        {
            double x = sd * r.Z() + a.Drift * n;
            if (lam > 0)
            {
                // Poisson(lam) par inversion.
                double L = Math.Exp(-lam), p = 1; int k = 0;
                do { k++; p *= r.U(); } while (p > L);
                k -= 1;
                for (int j = 0; j < k; j++) x += a.JumpDir * (a.JumpMin + (a.JumpMax - a.JumpMin) * r.U());
            }
            res[i] = x;
        }
        Array.Sort(res);
        return res;
    }

    static double Quantile(double[] sorted, double q)
    {
        double pos = q * (sorted.Length - 1);
        int i = (int)Math.Floor(pos);
        if (i >= sorted.Length - 1) return sorted[sorted.Length - 1];
        double f = pos - i;
        return sorted[i] * (1 - f) + sorted[i + 1] * f;
    }

    // Table[asset][duration] = { strike, callX5, callX10, callX50, putX5, putX10, putX50 } (mouvements relatifs).
    public static Dictionary<string, Dictionary<int, double[]>> BuildTable(int samples)
    {
        var table = new Dictionary<string, Dictionary<int, double[]>>();
        var r = new Rng(20260925);
        foreach (var a in Assets())
        {
            var row = new Dictionary<int, double[]>();
            foreach (int dur in DURATIONS)
            {
                int n = dur * 1000 / TICK_MS;
                var q = new double[7];
                if (a.JumpP <= 0)
                {
                    double sd = a.Sigma * Math.Sqrt(n);
                    q[0] = 0;
                    for (int m = 1; m <= 3; m++)
                    {
                        double p = TargetP(MULTS[m]);
                        q[m] = sd * InvNorm(1 - p);
                        q[m + 3] = -q[m];
                    }
                }
                else
                {
                    var s = SampleMoves(a, n, samples, r);
                    q[0] = Quantile(s, 0.5);
                    for (int m = 1; m <= 3; m++)
                    {
                        double p = TargetP(MULTS[m]);
                        q[m] = Quantile(s, 1 - p);
                        q[m + 3] = Quantile(s, p);
                    }
                }
                row[dur] = q;
            }
            table[a.Id] = row;
        }
        return table;
    }

    // Ligne gagnante en centimes (mêmes arrondis que le serveur).
    public static long BarrierCents(long entry, double rel)
    {
        return (long)Math.Round(entry * (1 + rel), MidpointRounding.AwayFromZero);
    }

    // Résultat d'un trade : 1 = gagné, 0 = perdu, -1 = égalité (mise rendue).
    public static int Outcome(bool call, long exit, long barrier)
    {
        if (exit == barrier) return -1;
        return (call ? exit > barrier : exit < barrier) ? 1 : 0;
    }

    public static string Prove(Dictionary<string, Dictionary<int, double[]>> table, int tradesPerCell, int stopTicksCap)
    {
        var sb = new StringBuilder();
        var inv = CultureInfo.InvariantCulture;
        sb.AppendLine("actif;duree_s;cote;sens;trades;gagnes;egalites;taux_gain;retour_joueur");
        var r = new Rng(777);
        double totalStake = 0, totalBack = 0;
        foreach (var a in Assets())
        {
            foreach (int dur in DURATIONS)
            {
                int n = dur * 1000 / TICK_MS;
                if (n > stopTicksCap) continue;
                double[] q = table[a.Id][dur];
                for (int m = 0; m < MULTS.Length; m++)
                {
                    for (int side = 0; side < 2; side++)
                    {
                        bool call = side == 0;
                        long won = 0, ties = 0; double back = 0;
                        long price = (long)Math.Round(a.Base * 100);
                        for (int t = 0; t < tradesPerCell; t++)
                        {
                            // Entrée : prix courant de la courbe, qui continue d'avancer.
                            for (int w = 0; w < 7; w++) price = Step(a, price, r);
                            long entry = price;
                            double rel = m == 0 ? q[0] : (call ? q[m] : q[m + 3]);
                            long bar = BarrierCents(entry, rel);
                            long p = entry;
                            for (int k = 0; k < n; k++) p = Step(a, p, r);
                            int o = Outcome(call, p, bar);
                            if (o == 1) { won++; back += MULTS[m]; }
                            else if (o == -1) { ties++; back += 1; }
                            // Pour ne pas dériver sur des heures : on repart d'une zone proche.
                            if (t % 50 == 49) price = (long)Math.Round(a.Base * 100);
                        }
                        totalStake += tradesPerCell; totalBack += back;
                        sb.AppendLine(string.Format(inv, "{0};{1};{2};{3};{4};{5};{6};{7:0.0000};{8:0.0000}",
                            a.Id, dur, MULTS[m], call ? "CALL" : "PUT", tradesPerCell, won, ties,
                            (double)won / tradesPerCell, back / tradesPerCell));
                    }
                }
            }
        }
        sb.AppendLine(string.Format(inv, "TOTAL;;;;;;;;{0:0.0000}", totalBack / totalStake));
        return sb.ToString();
    }

    public static string TableJson(Dictionary<string, Dictionary<int, double[]>> table)
    {
        var inv = CultureInfo.InvariantCulture;
        var sb = new StringBuilder("{");
        bool firstA = true;
        foreach (var kv in table)
        {
            if (!firstA) sb.Append(",");
            firstA = false;
            sb.Append("\"").Append(kv.Key).Append("\":{");
            bool firstD = true;
            foreach (var d in kv.Value)
            {
                if (!firstD) sb.Append(",");
                firstD = false;
                sb.Append("\"").Append(d.Key).Append("\":[");
                for (int i = 0; i < d.Value.Length; i++)
                {
                    if (i > 0) sb.Append(",");
                    sb.Append(d.Value[i].ToString("0.#########", inv));
                }
                sb.Append("]");
            }
            sb.Append("}");
        }
        sb.Append("}");
        return sb.ToString();
    }
}
