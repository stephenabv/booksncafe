import Image from "next/image";
import { PageHeader } from "@/components/site/page-header";
import { getPage, listPublishedTeamMembers } from "@/server/repositories/site";
import { buildPageMetadata } from "@/server/seo";

export const revalidate = 300;

export function generateMetadata() {
  return buildPageMetadata({ slug: "about", path: "/about", fallbackTitle: "About Us", fallbackDescription: "About Books ’n Cafe." });
}

export default async function AboutPage() {
  const [content, team] = await Promise.all([getPage("about"), listPublishedTeamMembers()]);
  return (
    <>
      <PageHeader
        title={content?.heading ?? "About Us"}
        crumbs={[
          { name: "Home", path: "/" },
          { name: "About", path: "/about" },
        ]}
      />
      <div className="container-page py-12">
        {content?.intro && (
          <div className="prose-cafe max-w-3xl text-lg leading-relaxed text-espresso-800">
            {content.intro.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        )}

        {team.length > 0 && (
          <section aria-labelledby="team" className="mt-16">
            <h2 id="team" className="text-3xl font-semibold">
              Meet the team
            </h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <li key={member.id} className="rounded-2xl border border-cream-200 bg-white p-6">
                  {member.imageUrl && (
                    <Image
                      src={member.imageUrl}
                      alt={`Portrait of ${member.name}`}
                      width={112}
                      height={112}
                      className="mb-4 size-28 rounded-full object-cover"
                    />
                  )}
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-sm font-medium text-amber-ink">{member.role}</p>
                  {member.bio && <p className="mt-3 text-sm leading-relaxed text-espresso-700">{member.bio}</p>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
