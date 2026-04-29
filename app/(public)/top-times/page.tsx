export const metadata = {
  title: "Top Times",
  description: "Top times for Texas A&M Club Swimming, provided by SwimCloud.",
};

const SWIMCLOUD_URL = "https://www.swimcloud.com/times/iframe/?team=10030419";

export default function TopTimesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-4xl font-bold">Top Times</h1>
        <p className="mt-2 text-muted-foreground">
          The top times for Texas A&M Club Swimming throughout the years!
        </p>
      </header>

      <div className="overflow-hidden rounded-lg border bg-card">
        <iframe
          src={SWIMCLOUD_URL}
          title="SwimCloud — TAMCS top times"
          className="block h-[80vh] min-h-[600px] w-full border-0"
          loading="lazy"
        />
      </div>

      <p className="mt-3 text-right text-xs text-muted-foreground">
        Times provided by{" "}
        <a
          href="https://www.swimcloud.com/team/10030419/"
          target="_blank"
          rel="noreferrer"
          className="text-primary underline-offset-4 hover:underline"
        >
          SwimCloud
        </a>
        .
      </p>
    </div>
  );
}
