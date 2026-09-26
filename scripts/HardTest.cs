// OROLADO — « test dur » : des milliers de faux joueurs sur plusieurs mois.
// Lancer : powershell -ExecutionPolicy Bypass -File scripts\hard-test.ps1
// Chaque trade suit les chances réelles du jeu (calibrées et vérifiées sur 9,6 M trades) :
// 88 % → 50 %, ×5 → 18,8 %, ×10 → 9,4 %, ×50 → 1,88 %. Gain max 2 000 $ par trade.
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text;

public static class HardTest
{
    static readonly double[] MULT = { 1.88, 5, 10, 50 };
    static readonly double[] WINP = { 0.5, 0.188, 0.094, 0.0188 };
    const double MAX_PAYOUT = 2000;

    class Rng
    {
        ulong s;
        public Rng(ulong seed) { s = seed * 0x9E3779B97F4A7C15UL + 1; }
        public double U() { s ^= s << 13; s ^= s >> 7; s ^= s << 17; return (s >> 11) * (1.0 / 9007199254740992.0); }
    }

    // Dépôt d'un nouveau joueur : beaucoup de petits, quelques moyens, de rares gros.
    static double FirstDeposit(Rng r)
    {
        double u = r.U();
        if (u < 0.55) return 3 + Math.Floor(r.U() * 8);       // 3–10 $
        if (u < 0.85) return 10 + Math.Floor(r.U() * 41);     // 10–50 $
        if (u < 0.97) return 50 + Math.Floor(r.U() * 251);    // 50–300 $
        return 300 + Math.Floor(r.U() * 2701);                // 300–3 000 $
    }

    public class Result
    {
        public double Deposits, Bonuses, Withdrawals, Volume;
        public long Trades, Players, WinnersOut;
        public double[] Daily;
        public List<double> BestPlayers = new List<double>();
        public double BestPlayerDeposit;
    }

    // Simule `days` jours avec `newPerDay` nouveaux déposants par jour.
    public static Result Run(int days, int newPerDay, double bonusShare, ulong seed)
    {
        var r = new Rng(seed);
        var res = new Result { Daily = new double[days] };
        var bal = new List<double>(); var dep = new List<double>(); var wag = new List<double>();
        var target = new List<double>(); var risk = new List<double>(); var alive = new List<bool>();
        var profit = new List<double>();
        for (int d = 0; d < days; d++)
        {
            for (int k = 0; k < newPerDay; k++)
            {
                double x = FirstDeposit(r);
                bal.Add(x); dep.Add(x); wag.Add(0); profit.Add(-x);
                target.Add(1.5 + r.U() * 3.5);              // veut retirer à 1,5× à 5× son dépôt
                risk.Add(0.02 + r.U() * 0.18);              // mise = 2 % à 20 % du solde
                alive.Add(true);
                res.Deposits += x; res.Daily[d] += x; res.Players++;
            }
            for (int i = 0; i < bal.Count; i++)
            {
                if (!alive[i]) continue;
                // Bonus admin : une petite partie des joueurs actifs reçoit 5 à 10 $.
                if (r.U() < bonusShare) { double b = r.U() < 0.5 ? 5 : 10; bal[i] += b; dep[i] += b; res.Bonuses += b; }
                int n = 20 + (int)(r.U() * 80);                // 20 à 100 trades ce jour-là
                for (int t = 0; t < n && bal[i] >= 1; t++)
                {
                    double u = r.U();
                    int m = u < 0.70 ? 0 : (u < 0.85 ? 1 : (u < 0.95 ? 2 : 3));
                    double stake = Math.Max(1, Math.Round(bal[i] * risk[i], 2));
                    stake = Math.Min(stake, Math.Min(bal[i], Math.Floor(MAX_PAYOUT / MULT[m] * 100) / 100));
                    bal[i] -= stake; wag[i] += stake; res.Volume += stake; res.Trades++;
                    if (r.U() < WINP[m]) bal[i] += Math.Round(stake * MULT[m], 2);
                    if (wag[i] >= dep[i] * 2 && bal[i] >= dep[i] * target[i])
                    {
                        // Retrait du gain (condition ×2 remplie).
                        res.Withdrawals += bal[i]; res.Daily[d] -= bal[i];
                        profit[i] += bal[i]; bal[i] = 0; res.WinnersOut++; alive[i] = false; break;
                    }
                }
                if (alive[i] && bal[i] < 1)
                {
                    // Solde vide : 30 % rechargent, les autres arrêtent.
                    if (r.U() < 0.30) { double x = FirstDeposit(r); bal[i] += x; dep[i] += x; profit[i] -= x; res.Deposits += x; res.Daily[d] += x; }
                    else alive[i] = false;
                }
            }
        }
        profit.Sort(); profit.Reverse();
        for (int i = 0; i < Math.Min(5, profit.Count); i++) res.BestPlayers.Add(profit[i]);
        return res;
    }

    public static string Report(int days, int newPerDay, double bonusShare, int runs)
    {
        var inv = CultureInfo.InvariantCulture;
        var sb = new StringBuilder();
        var nets = new List<double>(); var worstDays = new List<double>(); var lossDays = 0L; var totalDays = 0L;
        double dep = 0, bon = 0, wd = 0, vol = 0, best = 0; long trades = 0, players = 0, winners = 0;
        for (int k = 0; k < runs; k++)
        {
            var res = Run(days, newPerDay, bonusShare, (ulong)(1000 + k));
            double net = res.Deposits - res.Withdrawals;
            nets.Add(net);
            double worst = double.MaxValue;
            foreach (var x in res.Daily) { if (x < worst) worst = x; if (x < 0) lossDays++; totalDays++; }
            worstDays.Add(worst);
            dep += res.Deposits; bon += res.Bonuses; wd += res.Withdrawals; vol += res.Volume;
            trades += res.Trades; players += res.Players; winners += res.WinnersOut;
            if (res.BestPlayers.Count > 0 && res.BestPlayers[0] > best) best = res.BestPlayers[0];
        }
        nets.Sort(); worstDays.Sort();
        Func<List<double>, double, double> q = (l, p) => l[(int)Math.Min(l.Count - 1, Math.Max(0, Math.Round(p * (l.Count - 1))))];
        sb.AppendLine(string.Format(inv, "Scenario : {0} nouveaux deposants/jour, {1} jours, bonus {2:P0} des joueurs actifs/jour, {3} simulations", newPerDay, days, bonusShare, runs));
        sb.AppendLine(string.Format(inv, "Par simulation (moyenne) : {0:N0} joueurs, {1:N0} trades, volume mise {2:N0} $", players / (double)runs, trades / (double)runs, vol / runs));
        sb.AppendLine(string.Format(inv, "Depots {0:N0} $ | Bonus offerts {1:N0} $ | Retraits payes {2:N0} $", dep / runs, bon / runs, wd / runs));
        sb.AppendLine(string.Format(inv, "Benefice caisse sur la periode (depots - retraits) : mauvais cas {0:N0} $ | normal {1:N0} $ | bon cas {2:N0} $", q(nets, 0.05), q(nets, 0.5), q(nets, 0.95)));
        sb.AppendLine(string.Format(inv, "Benefice moyen par jour : {0:N0} $", (dep - wd) / runs / days));
        sb.AppendLine(string.Format(inv, "Jours ou la caisse sort plus qu'elle ne rentre : {0:P1}", lossDays / (double)totalDays));
        sb.AppendLine(string.Format(inv, "Pire journee observee : {0:N0} $ (median des pires journees {1:N0} $)", worstDays[0], q(worstDays, 0.5)));
        sb.AppendLine(string.Format(inv, "Joueurs repartis avec un gain retire : {0:P1}", winners / (double)players));
        sb.AppendLine(string.Format(inv, "Plus gros gain net d'un seul joueur (toutes simulations) : {0:N0} $", best));
        return sb.ToString();
    }
}
