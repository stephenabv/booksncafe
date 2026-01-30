import { useEffect, useState } from "react";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  image?: string;
  bio?: string;
}

const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  return Promise.resolve([
    {
      id: "1",
      name: "Engr. Stephen",
      role: "Founder & Creator",
      image: "https://images.unsplash.com/photo-XXXXXXXXXXXX?&w=200",
      bio: "Hi, I'm Stephen! I founded Books ’n Cafe to create a welcoming space where stories and coffee come together. I handle everything from curating books, designing events, to ensuring every cup of coffee is perfect. My goal is to bring community and creativity under one roof."
    }
  ]);
};

const About: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTeam = async () => {
      try {
        const data = await fetchTeamMembers();
        setTeam(data);
      } catch (error) {
        console.error("Failed to load team members", error);
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, []);

  return (
    <section className="px-6 py-12 max-w-6xl mx-auto text-center">
      <h1 className="mb-8 text-4xl font-bold text-amber-500">About Us</h1>

      <p className="mb-12 text-neutral-400 max-w-3xl mx-auto leading-relaxed text-justify">
        Books ’n Cafe is a cozy corner where stories, coffee, and community meet.
        We provide a space for book lovers and coffee enthusiasts to relax, connect, and be inspired.
        Our mission: nurture the love for reading while enjoying handcrafted coffee.
        Every event, every cup, and every recommendation is thoughtfully crafted to make your experience memorable.
      </p>

      <h2 className="mb-6 text-3xl font-semibold text-amber-400">Meet Our Team</h2>

      {loading ? (
        <p className="text-neutral-400">Loading team members...</p>
      ) : (
        <div
          className={`grid gap-6 ${team.length === 1 ? "sm:grid-cols-1 lg:grid-cols-1 justify-items-center" : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
        >
          {team.map(member => (
            <div
              key={member.id}
              className="rounded-lg bg-neutral-800 p-6 shadow hover:shadow-2xl transition max-w-md text-center"
            >
              {member.image && (
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-40 w-40 mx-auto rounded-full object-cover mb-4"
                />
              )}
              <h3 className="text-white font-semibold">{member.name}</h3>
              <p className="text-neutral-400 text-sm mb-2">{member.role}</p>
              {member.bio && <p className="text-neutral-300 text-sm">{member.bio}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default About;
