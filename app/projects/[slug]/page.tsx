import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import {
  projects,
  getProject,
  profile,
  externalLinkProps,
  DEMO_PROJECT_SLUG,
  DEMO_HREF,
} from "@/lib/content";
import { renderBody } from "@/lib/richtext";
import AiDisclaimer from "@/components/AiDisclaimer";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  return { title: project ? `${project.title} · ${profile.name}` : "Project" };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <main>
      <Nav />
      <article className="page page-narrow">
        <Link className="back-link" href="/projects">
          ← See all
        </Link>
        <div className="page-head">
          <div className="label-mono detail-meta">
            {project.period && <span>{project.period}</span>}
            <span>{project.venue}</span>
          </div>
          <h1 className="page-title">{project.title}</h1>
        </div>

        <p className="section-lead">{project.blurb}</p>

        {/* The demo half of the pairing: the hero links here, this links back.
            Sits above the body because the write-up's own copy points at it
            ("you can try it..."), and a reader who came for the demo should
            not have to find it in the link row under the tags. */}
        {project.slug === DEMO_PROJECT_SLUG && (
          <div className="detail-demo">
            <Link className="btn-primary" href={DEMO_HREF}>
              Try the live demo
            </Link>
          </div>
        )}

        {project.aiAssisted && <AiDisclaimer />}

        {project.body && (
          <div className="prose">{renderBody(project.body)}</div>
        )}

        <div className="work-tags" style={{ marginBottom: 28 }}>
          {project.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>

        {project.links.length > 0 && (
          <div className="detail-links">
            {project.links.map((lk) => (
              <a key={lk.label} className="detail-link" href={lk.href} {...externalLinkProps(lk.href)}>
                {lk.label}
              </a>
            ))}
          </div>
        )}
      </article>
      <Footer />
    </main>
  );
}
