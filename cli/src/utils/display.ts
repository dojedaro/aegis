import chalk from "chalk";
import Table from "cli-table3";

export const colors = {
  primary: chalk.cyan,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.blue,
  muted: chalk.gray,
  highlight: chalk.magenta,
};

export const icons = {
  check: chalk.green("✓"),
  cross: chalk.red("✗"),
  warning: chalk.yellow("⚠"),
  info: chalk.blue("ℹ"),
  bullet: chalk.cyan("•"),
  arrow: chalk.cyan("→"),
  critical: chalk.red("●"),
  high: chalk.hex("#FFA500")("●"),
  medium: chalk.yellow("●"),
  low: chalk.green("●"),
};

export function header(text: string): void {
  console.log();
  console.log(colors.primary("═".repeat(60)));
  console.log(colors.primary.bold(`  ${text}`));
  console.log(colors.primary("═".repeat(60)));
  console.log();
}

export function subheader(text: string): void {
  console.log();
  console.log(colors.info.bold(`▸ ${text}`));
  console.log(colors.muted("─".repeat(40)));
}

export function success(text: string): void {
  console.log(`${icons.check} ${colors.success(text)}`);
}

export function error(text: string): void {
  console.log(`${icons.cross} ${colors.error(text)}`);
}

export function warning(text: string): void {
  console.log(`${icons.warning} ${colors.warning(text)}`);
}

export function info(text: string): void {
  console.log(`${icons.info} ${colors.info(text)}`);
}

export function bullet(text: string): void {
  console.log(`  ${icons.bullet} ${text}`);
}

export function riskLevel(level: string): string {
  switch (level.toLowerCase()) {
    case "critical":
      return `${icons.critical} ${chalk.red.bold("CRITICAL")}`;
    case "high":
      return `${icons.high} ${chalk.hex("#FFA500").bold("HIGH")}`;
    case "medium":
      return `${icons.medium} ${chalk.yellow.bold("MEDIUM")}`;
    case "low":
      return `${icons.low} ${chalk.green.bold("LOW")}`;
    default:
      return level;
  }
}

export function complianceStatus(status: string): string {
  switch (status.toLowerCase()) {
    case "compliant":
      return chalk.green.bold("COMPLIANT");
    case "non_compliant":
    case "non-compliant":
      return chalk.red.bold("NON-COMPLIANT");
    case "needs_review":
    case "needs-review":
      return chalk.yellow.bold("NEEDS REVIEW");
    default:
      return status;
  }
}

export function severity(level: string): string {
  switch (level.toLowerCase()) {
    case "critical":
      return chalk.bgRed.white.bold(` ${level.toUpperCase()} `);
    case "high":
      return chalk.bgHex("#FFA500").black.bold(` ${level.toUpperCase()} `);
    case "medium":
      return chalk.bgYellow.black.bold(` ${level.toUpperCase()} `);
    case "low":
      return chalk.bgGreen.black.bold(` ${level.toUpperCase()} `);
    default:
      return level;
  }
}

export function createTable(headers: string[], options: Partial<Table.TableConstructorOptions> = {}): Table.Table {
  return new Table({
    head: headers.map((h) => colors.primary.bold(h)),
    style: {
      head: [],
      border: ["cyan"],
    },
    ...options,
  });
}

export function progressBar(current: number, total: number, width: number = 30): string {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const bar = colors.success("█".repeat(filled)) + colors.muted("░".repeat(empty));
  return `${bar} ${percentage}%`;
}

export function keyValue(key: string, value: string, keyWidth: number = 20): void {
  console.log(`  ${colors.muted(key.padEnd(keyWidth))} ${value}`);
}

export function divider(): void {
  console.log(colors.muted("─".repeat(60)));
}

export function box(content: string[], title?: string): void {
  const maxLength = Math.max(...content.map((l) => l.length), title?.length || 0);
  const width = maxLength + 4;

  console.log(colors.cyan("┌" + "─".repeat(width - 2) + "┐"));
  if (title) {
    console.log(colors.cyan("│ ") + colors.primary.bold(title.padEnd(width - 4)) + colors.cyan(" │"));
    console.log(colors.cyan("├" + "─".repeat(width - 2) + "┤"));
  }
  for (const line of content) {
    console.log(colors.cyan("│ ") + line.padEnd(width - 4) + colors.cyan(" │"));
  }
  console.log(colors.cyan("└" + "─".repeat(width - 2) + "┘"));
}

export function riskMatrix(): void {
  console.log();
  console.log(colors.primary.bold("  Risk Matrix"));
  console.log();
  console.log("       Impact");
  console.log("       1   2   3   4   5");
  console.log("     ┌───┬───┬───┬───┬───┐");
  console.log(`   5 │${chalk.green(" 5 ")}│${chalk.yellow("10 ")}│${chalk.hex("#FFA500")("15 ")}│${chalk.red("20 ")}│${chalk.red("25 ")}│`);
  console.log("     ├───┼───┼───┼───┼───┤");
  console.log(`   4 │${chalk.green(" 4 ")}│${chalk.yellow(" 8 ")}│${chalk.yellow("12 ")}│${chalk.hex("#FFA500")("16 ")}│${chalk.red("20 ")}│`);
  console.log(" L   ├───┼───┼───┼───┼───┤");
  console.log(`   3 │${chalk.green(" 3 ")}│${chalk.green(" 6 ")}│${chalk.yellow(" 9 ")}│${chalk.yellow("12 ")}│${chalk.hex("#FFA500")("15 ")}│`);
  console.log("     ├───┼───┼───┼───┼───┤");
  console.log(`   2 │${chalk.green(" 2 ")}│${chalk.green(" 4 ")}│${chalk.green(" 6 ")}│${chalk.yellow(" 8 ")}│${chalk.yellow("10 ")}│`);
  console.log("     ├───┼───┼───┼───┼───┤");
  console.log(`   1 │${chalk.green(" 1 ")}│${chalk.green(" 2 ")}│${chalk.green(" 3 ")}│${chalk.green(" 4 ")}│${chalk.green(" 5 ")}│`);
  console.log("     └───┴───┴───┴───┴───┘");
  console.log();
}

export function banner(): void {
  console.log();
  console.log(colors.primary("    ╔═══════════════════════════════════════════════╗"));
  console.log(colors.primary("    ║") + colors.primary.bold("              AEGIS COMPLIANCE                 ") + colors.primary("║"));
  console.log(colors.primary("    ║") + colors.muted("       AI-Powered Compliance Operations        ") + colors.primary("║"));
  console.log(colors.primary("    ╚═══════════════════════════════════════════════╝"));
  console.log();
}
