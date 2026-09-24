using System;
using System.Text;

public static class Sim48 {
  static readonly Random R = new Random(42);
  const double P = 0.48;
  const double PROFIT = 0.88;

  static double Anti(double baseP, double stake, double last, int ls) {
    // Frein seulement à partir du 3e double (lossStreak >= 3 + mise qui monte).
    bool rising = last > 0.009 && stake >= last * 1.75;
    if (!(ls >= 3 && rising)) return baseP;
    int steps = Math.Min(ls - 2, 6);
    double p = baseP * Math.Pow(0.62, steps);
    return Math.Max(0.10, Math.Min(baseP * 0.55, p));
  }

  static bool Roll(double p) { return R.NextDouble() < p; }

  static void Dump(StringBuilder sb, string lab, double pnl, int w, int l, int ruin, int hits) {
    double wr = (w + l) > 0 ? (double)w / (w + l) : 0;
    sb.AppendLine(lab + ": WR=" + wr.ToString("P2") + " PnL joueur=" + pnl.ToString("F2")
      + " maison=" + (-pnl).ToString("F2") + " ruines=" + ruin + " hits=" + hits);
  }

  public static int Main() {
    int N = 1000000;
    var sb = new StringBuilder();
    double ev = P * PROFIT - (1 - P);
    sb.AppendLine("EV flat=" + ev.ToString("F4") + " (" + (ev * 100).ToString("F2") + "% maison)");

    double bank = 10000; int w = 0, l = 0, ruin = 0;
    for (int i = 0; i < N; i++) {
      if (bank < 1) { ruin++; bank = 10000; }
      if (Roll(P)) { w++; bank = Math.Round(bank + PROFIT, 2); }
      else { l++; bank = Math.Round(bank - 1, 2); }
    }
    double pnlFlat = bank - 10000;
    Dump(sb, "Flat 1$", pnlFlat, w, l, ruin, 0);

    bank = 10000; w = 0; l = 0; ruin = 0;
    double stake = 1, last = 0; int ls = 0; double maxS = 512;
    for (int i = 0; i < N; i++) {
      if (bank < 1) { ruin++; bank = 10000; stake = 1; ls = 0; last = 0; }
      if (stake > bank) stake = Math.Round(bank, 2);
      if (stake < 1) { ruin++; bank = 10000; stake = 1; ls = 0; continue; }
      if (Roll(P)) { w++; bank = Math.Round(bank + stake * PROFIT, 2); last = stake; stake = 1; ls = 0; }
      else { l++; bank = Math.Round(bank - stake, 2); last = stake; ls++; stake = Math.Round(Math.Min(maxS, stake * 2), 2); }
    }
    double pnlBare = bank - 10000;
    Dump(sb, "Martingale SANS", pnlBare, w, l, ruin, 0);

    bank = 10000; w = 0; l = 0; ruin = 0; stake = 1; last = 0; ls = 0; int hits = 0;
    for (int i = 0; i < N; i++) {
      if (bank < 1) { ruin++; bank = 10000; stake = 1; ls = 0; last = 0; }
      if (stake > bank) stake = Math.Round(bank, 2);
      if (stake < 1) { ruin++; bank = 10000; stake = 1; ls = 0; continue; }
      double p = Anti(P, stake, last, ls);
      if (p + 0.0001 < P) hits++;
      if (Roll(p)) { w++; bank = Math.Round(bank + stake * PROFIT, 2); last = stake; stake = 1; ls = 0; }
      else { l++; bank = Math.Round(bank - stake, 2); last = stake; ls++; stake = Math.Round(Math.Min(maxS, stake * 2), 2); }
    }
    double pnlSh = bank - 10000;
    Dump(sb, "Martingale + blindage", pnlSh, w, l, ruin, hits);

    bank = 500; w = 0; l = 0; ruin = 0; stake = 1; last = 0; ls = 0; hits = 0;
    for (int i = 0; i < N; i++) {
      if (bank < 1) { ruin++; bank = 500; stake = 1; ls = 0; last = 0; }
      if (stake > bank) stake = Math.Round(bank, 2);
      if (stake < 1) { ruin++; bank = 500; stake = 1; ls = 0; continue; }
      double p = Anti(P, stake, last, ls);
      if (p + 0.0001 < P) hits++;
      if (Roll(p)) { w++; bank = Math.Round(bank + stake * PROFIT, 2); last = stake; stake = 1; ls = 0; }
      else { l++; bank = Math.Round(bank - stake, 2); last = stake; ls++; stake = Math.Round(Math.Min(256.0, stake * 2), 2); }
    }
    Dump(sb, "Martingale bankroll 500$ + blindage", bank - 500, w, l, ruin, hits);

    double house = 0;
    for (int a = 0; a < 1000; a++) {
      double b = 100;
      for (int i = 0; i < 1000; i++) {
        if (b < 2) b = 100;
        if (Roll(P)) b = Math.Round(b + 2 * PROFIT, 2);
        else b = Math.Round(b - 2, 2);
      }
      house += -(b - 100);
    }
    sb.AppendLine("1000 comptes x 1000 flat 2$: maison=" + Math.Round(house, 2));

    bool ok = pnlFlat < 0 && pnlBare < 0 && pnlSh < 0 && pnlSh < pnlBare && house > 0;
    sb.AppendLine(ok ? "OK — maison gagnante partout" : "ECHEC");
    Console.Write(sb.ToString());
    return ok ? 0 : 1;
  }
}
