import NavBar from "@/components/NavBar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0B1410]">
      <NavBar />
      <main className="flex flex-1 flex-col items-center justify-center px-16 py-32">
        <h1 className="text-3xl font-semibold tracking-tight text-[#E8EDE9]">
          AETHER
        </h1>
        <p className="mt-4 max-w-md text-center text-sm text-[#8FA396]">
          Autonomous Eco Sentinel for Threat Evaluation, Habitat Intelligence
          and Ecosystem Resilience.
        </p>
      </main>
    </div>
  );
}