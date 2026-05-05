import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, ChevronRight, AlertTriangle, Lightbulb, Info, ArrowRight } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { getArticleBySlug, getRelatedArticles } from '../guides';
import type { GuideHighlight, GuideSection } from '../guides/types';

const isIOS = () => typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isLowPerf = () => isIOS() || (typeof window !== 'undefined' && window.innerWidth <= 768);
const _lp = isLowPerf();

/* ══════════════════════════════════════════
   HIGHLIGHT BOX
══════════════════════════════════════════ */
function HighlightBox({ highlight }: { highlight: GuideHighlight }) {
  const configs = {
    warning: { bg: '#fef3c7', border: '#f59e0b', icon: <AlertTriangle size={16} color="#d97706" />, titleColor: '#92400e', textColor: '#78350f', accent: '#f59e0b' },
    tip: { bg: '#ecfdf5', border: '#10b981', icon: <Lightbulb size={16} color="#059669" />, titleColor: '#064e3b', textColor: '#065f46', accent: '#10b981' },
    info: { bg: '#eff6ff', border: '#3b82f6', icon: <Info size={16} color="#2563eb" />, titleColor: '#1e3a5f', textColor: '#1e40af', accent: '#3b82f6' },
  };
  const c = configs[highlight.type];

  return (
    <div style={{
      background: c.bg, borderLeft: `4px solid ${c.border}`, borderRadius: '0 12px 12px 0',
      padding: 'clamp(16px,3vw,24px)', margin: '28px 0',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {c.icon}
        <span style={{ fontSize: 14, fontWeight: 700, color: c.titleColor }}>{highlight.title}</span>
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, color: c.textColor, margin: 0 }}>{highlight.content}</p>
    </div>
  );
}

/* ══════════════════════════════════════════
   SECTION RENDERER
══════════════════════════════════════════ */
function SectionRenderer({ section }: { section: GuideSection }) {
  return (
    <section id={section.id} style={{ marginBottom: 48 }}>
      <h2 style={{
        fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, color: '#0f2d3d',
        lineHeight: 1.3, marginBottom: 16, paddingBottom: 12,
        borderBottom: '2px solid #e8ecf0',
      }}>
        {section.title}
      </h2>

      {/* Contenu principal */}
      {section.content.split('\n\n').map((p, i) => (
        <p key={i} style={{ fontSize: 16, lineHeight: 1.8, color: '#334155', marginBottom: 16 }}>{p}</p>
      ))}

      {/* Sous-sections */}
      {section.subsections?.map((sub, i) => (
        <div key={i} style={{ marginBottom: 20, paddingLeft: 20, borderLeft: '3px solid #e2e8f0' }}>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 8, lineHeight: 1.4 }}>
            {sub.title}
          </h3>
          {sub.content.split('\n\n').map((p, j) => (
            <p key={j} style={{ fontSize: 15, lineHeight: 1.8, color: '#475569', marginBottom: 12 }}>{p}</p>
          ))}
        </div>
      ))}

      {/* Bullets */}
      {section.bullets && (
        <ul style={{ margin: '16px 0', paddingLeft: 0, listStyle: 'none' }}>
          {section.bullets.map((b, i) => (
            <li key={i} style={{
              display: 'flex', gap: 12, alignItems: 'flex-start',
              padding: '10px 16px', marginBottom: 6,
              background: i % 2 === 0 ? '#f8fafc' : 'transparent',
              borderRadius: 8,
            }}>
              <span style={{
                minWidth: 6, height: 6, borderRadius: '50%', background: '#2a7d9c',
                marginTop: 9, flexShrink: 0,
              }} />
              <span style={{ fontSize: 15, lineHeight: 1.7, color: '#334155' }}>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Numbered list */}
      {section.numberedList && (
        <ol style={{ margin: '16px 0', paddingLeft: 0, listStyle: 'none', counterReset: 'guide-counter' }}>
          {section.numberedList.map((item, i) => (
            <li key={i} style={{
              display: 'flex', gap: 14, alignItems: 'flex-start',
              padding: '12px 16px', marginBottom: 4,
              background: '#f8fafc', borderRadius: 10,
              borderLeft: '3px solid #2a7d9c',
            }}>
              <span style={{
                minWidth: 28, height: 28, borderRadius: '50%', background: '#2a7d9c',
                color: '#fff', fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 15, lineHeight: 1.7, color: '#334155', paddingTop: 3 }}>{item}</span>
            </li>
          ))}
        </ol>
      )}

      {/* Highlight */}
      {section.highlight && <HighlightBox highlight={section.highlight} />}
    </section>
  );
}

/* ══════════════════════════════════════════
   TABLE OF CONTENTS
══════════════════════════════════════════ */
function TableOfContents({ sections }: { sections: GuideSection[] }) {
  return (
    <nav style={{
      background: '#fff', borderRadius: 14, padding: 'clamp(22px,3vw,30px)',
      border: '1px solid #e8ecf0', marginBottom: 40,
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: '#2a7d9c', marginBottom: 16, margin: '0 0 16px' }}>
        Dans cet article
      </p>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
        {sections.map((s, i) => (
          <a
            key={s.id} href={`#${s.id}`}
            style={{
              fontSize: 14.5, color: '#334155', textDecoration: 'none', fontWeight: 500,
              padding: '10px 14px', borderRadius: 10,
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f9fc'; e.currentTarget.style.color = '#2a7d9c'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#334155'; }}
          >
            <span style={{
              minWidth: 30, height: 30, borderRadius: '50%', background: '#2a7d9c',
              color: '#fff', fontSize: 12, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{i + 1}</span>
            {s.title}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
export default function GuideArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Fallback SEO for 404
  useSEO(
    article
      ? { title: article.seo.title, description: article.seo.description, canonical: `/guides/${article.slug}` }
      : { title: 'Guide non trouvé — Verimo', description: '' }
  );

  // Schema.org Article + BreadcrumbList
  useEffect(() => {
    if (!article) return;
    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.seo.description,
        datePublished: article.publishedAt,
        dateModified: article.updatedAt,
        author: { '@type': 'Organization', name: 'Verimo', url: 'https://www.verimo.fr' },
        publisher: { '@type': 'Organization', name: 'Verimo', url: 'https://www.verimo.fr' },
        mainEntityOfPage: `https://www.verimo.fr/guides/${article.slug}`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://www.verimo.fr/' },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://www.verimo.fr/guides' },
          { '@type': 'ListItem', position: 3, name: article.categoryLabel, item: `https://www.verimo.fr/guides?cat=${article.category}` },
          { '@type': 'ListItem', position: 4, name: article.title },
        ],
      },
    ];
    const scripts = schemas.map((s) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(s);
      document.head.appendChild(script);
      return script;
    });
    // og:type article
    let ogType = document.querySelector<HTMLMetaElement>('meta[property="og:type"]');
    if (!ogType) { ogType = document.createElement('meta'); ogType.setAttribute('property', 'og:type'); document.head.appendChild(ogType); }
    ogType.content = 'article';
    return () => { scripts.forEach((s) => document.head.removeChild(s)); if (ogType) ogType.content = 'website'; };
  }, [article]);

  if (!article) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f7f8fa', minHeight: '100vh' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '120px 24px', textAlign: 'center' as const }}>
          <p style={{ fontSize: 64, marginBottom: 16 }}>📄</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f2d3d', marginBottom: 12 }}>Guide non trouvé</h1>
          <p style={{ fontSize: 15, color: '#64748b', marginBottom: 24 }}>Cet article n'existe pas encore ou a été déplacé.</p>
          <Link to="/guides" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', background: '#2a7d9c', color: '#fff',
            borderRadius: 10, fontWeight: 600, fontSize: 14, textDecoration: 'none',
          }}>
            <ArrowLeft size={16} /> Retour aux guides
          </Link>
        </div>
      </div>
    );
  }

  const related = getRelatedArticles(article.relatedSlugs);

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f7f8fa', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <section style={{
        background: 'linear-gradient(165deg, #ffffff 0%, #f2f9fb 40%, #e6f3f7 100%)',
        paddingTop: 72, position: 'relative', overflow: 'hidden',
      }}>
        {/* Cercles décoratifs */}
        <div style={{ position: 'absolute', top: -60, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(42,125,156,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(36px,6vw,64px) clamp(20px,4vw,48px) 42px', position: 'relative', zIndex: 1 }}>

          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: _lp ? 2 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lp ? 0.15 : 0.3 }}
            aria-label="Fil d'Ariane"
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, flexWrap: 'wrap' as const }}
          >
            <Link to="/" style={{ fontSize: 15, fontWeight: 500, color: '#64748b', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2a7d9c'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >Accueil</Link>
            <ChevronRight size={14} color="#94a3b8" />
            <Link to="/guides" style={{ fontSize: 15, fontWeight: 500, color: '#64748b', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#2a7d9c'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >Guides</Link>
            <ChevronRight size={14} color="#94a3b8" />
            <span style={{ fontSize: 15, color: '#2a7d9c', fontWeight: 700 }}>{article.categoryLabel}</span>
          </motion.nav>

          {/* Badge catégorie */}
          <motion.div
            initial={{ opacity: 0, y: _lp ? 3 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lp ? 0.15 : 0.35, delay: 0.03 }}
            style={{ marginBottom: 16 }}
          >
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8,
              background: article.categoryColor + '12', color: article.categoryColor,
              border: `1px solid ${article.categoryColor}25`,
            }}>
              {article.categoryIcon} {article.categoryLabel}
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: _lp ? 4 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: _lp ? 0.15 : 0.4, delay: 0.06 }}
            style={{
              fontSize: 'clamp(24px, 4.5vw, 36px)', fontWeight: 800, color: '#0f2d3d',
              lineHeight: 1.2, marginBottom: 14, maxWidth: 850,
            }}
          >
            {article.title}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            style={{
              fontSize: 16, color: '#4a5568', lineHeight: 1.6,
              maxWidth: 750, marginBottom: 18,
            }}
          >
            {article.subtitle}
          </motion.p>

          {/* Meta */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.25 }}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#94a3b8' }}>
              <Calendar size={13} /> Mis à jour le {new Date(article.updatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </motion.div>
        </div>

        {/* Fondu en bas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, transparent, #f7f8fa)', pointerEvents: 'none' }} />
      </section>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 clamp(20px,4vw,48px) 60px' }}>
        <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>

          {/* ── MAIN CONTENT ── */}
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ flex: 1, minWidth: 0 }}
          >

            {/* DocInfo encart */}
            {article.docInfo && (
              <div style={{
                background: 'linear-gradient(135deg, #f0f9fc 0%, #e8f4f8 100%)', borderRadius: 14,
                padding: 'clamp(22px,3vw,30px)', borderLeft: `5px solid #2a7d9c`,
                marginBottom: 32, marginTop: 32,
                boxShadow: '0 2px 12px rgba(42,125,156,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{
                    fontSize: 28, width: 44, height: 44, borderRadius: 10,
                    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(42,125,156,0.08)',
                  }}>{article.docInfo.emoji}</span>
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0f2d3d', display: 'block', lineHeight: 1.2 }}>{article.docInfo.label}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#2a7d9c', letterSpacing: 0.5,
                      textTransform: 'uppercase' as const,
                    }}>Ce document en bref</span>
                  </div>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: '#334155', margin: 0 }}>
                  {article.docInfo.definition}
                </p>
              </div>
            )}

            {/* Intro */}
            <div style={{ marginBottom: 40, marginTop: article.docInfo ? 0 : 32 }}>
              {article.intro.split('\n\n').map((p, i) => (
                <p key={i} style={{
                  fontSize: 16, lineHeight: 1.85, color: '#334155', marginBottom: 16,
                  ...(i === 0 ? { fontSize: 17, fontWeight: 500, color: '#1e293b' } : {}),
                }}>
                  {p}
                </p>
              ))}
            </div>

            {/* Table of Contents */}
            <TableOfContents sections={article.sections} />

            {/* Sections avec CTA intermédiaire après la 3e section */}
            {article.sections.map((section, idx) => (
              <div key={section.id}>
                <SectionRenderer section={section} />
                {idx === 2 && article.sections.length > 4 && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0f9fc 0%, #e8f4f8 100%)',
                    borderRadius: 14, padding: 'clamp(20px,3vw,28px)',
                    borderLeft: '4px solid #2a7d9c', marginBottom: 48,
                  }}>
                    <p style={{ fontSize: 15, lineHeight: 1.7, color: '#334155', margin: '0 0 14px' }}>
                      Vous n'avez pas le temps de tout vérifier vous-même ? Verimo analyse vos documents et vous donne un rapport avec score, risques et leviers de négociation.
                    </p>
                    <Link to="/start" style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      padding: '10px 22px', background: '#2a7d9c', color: '#fff',
                      borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#1f6a86'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#2a7d9c'; }}
                    >
                      Faire analyser mes documents <ArrowRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            ))}

            {/* Conclusion */}
            <div style={{
              background: '#fff', borderRadius: 14, padding: 'clamp(24px,4vw,32px)',
              border: '1px solid #e2e8f0', marginBottom: 32, marginTop: 48,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2d3d', marginBottom: 16, lineHeight: 1.3 }}>
                En résumé
              </h2>
              {article.conclusion.split('\n\n').map((p, i) => (
                <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#334155', marginBottom: 12 }}>{p}</p>
              ))}
            </div>

            {/* CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #0e2a38 0%, #1a4a5e 100%)',
              borderRadius: 16, padding: 'clamp(28px,5vw,40px)', position: 'relative',
              overflow: 'hidden', marginBottom: 40,
            }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', border: '30px solid rgba(93,191,224,0.06)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: '#5dbfe0', marginBottom: 8, margin: '0 0 8px' }}>
                  {article.cta.title}
                </p>
                <p style={{ fontSize: 'clamp(16px,2.5vw,20px)', fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.4, margin: '0 0 8px' }}>
                  {article.cta.description}
                </p>
                <Link to={article.cta.buttonLink} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#fff', color: '#0f2d3d', fontSize: 14, fontWeight: 700,
                  padding: '14px 28px', borderRadius: 12, textDecoration: 'none',
                  marginTop: 16, transition: 'all 0.2s',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
                >
                  {article.cta.buttonText} <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Related articles */}
            {related.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f2d3d', marginBottom: 16 }}>
                  À lire aussi
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {related.map((r) => (
                    <Link key={r.slug} to={`/guides/${r.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        background: '#fff', borderRadius: 12, padding: 18,
                        border: '1px solid #e8ecf0', transition: 'all 0.18s',
                        height: '100%', display: 'flex', flexDirection: 'column' as const,
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2a7d9c'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(42,125,156,0.07)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e8ecf0'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        <span style={{ fontSize: 10, fontWeight: 600, color: r.categoryColor, marginBottom: 8 }}>
                          {r.categoryIcon} {r.categoryLabel}
                        </span>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', lineHeight: 1.4, marginBottom: 6, margin: 0, flex: 1 }}>{r.title}</h3>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#2a7d9c', marginTop: 10 }}>Lire →</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back link */}
            <div style={{ textAlign: 'center' as const, paddingBottom: 20 }}>
              <Link to="/guides" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 14, fontWeight: 600, color: '#2a7d9c', textDecoration: 'none',
                padding: '12px 24px', borderRadius: 10, border: '1px solid #d8e4ea',
                transition: 'all 0.15s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#edf7fb'; e.currentTarget.style.borderColor = '#2a7d9c'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#d8e4ea'; }}
              >
                <ArrowLeft size={15} /> Voir tous les guides
              </Link>
            </div>
          </motion.article>

          {/* ── SIDEBAR (desktop only) ── */}
          <aside className="guide-sidebar" style={{
            width: 300, flexShrink: 0, position: 'sticky' as const, top: 100,
            alignSelf: 'flex-start', display: 'flex', flexDirection: 'column' as const, gap: 20,
            paddingTop: 32,
          }}>
            {/* Quick CTA */}
            <div style={{
              background: '#fff', borderRadius: 14, padding: 24,
              border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', marginBottom: 8, margin: '0 0 8px' }}>
                Analysez vos documents
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: '#64748b', marginBottom: 16, margin: '0 0 16px' }}>
                Score /20, risques détectés et pistes de négociation en quelques minutes.
              </p>
              <Link to="/start" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 20px', background: '#2a7d9c', color: '#fff',
                borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                transition: 'all 0.15s', width: '100%', boxSizing: 'border-box' as const,
              }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#1f6a86'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#2a7d9c'; }}
              >
                Analyser mon bien <ArrowRight size={14} />
              </Link>
            </div>

            {/* Pricing hint */}
            <div style={{
              background: '#f8fafc', borderRadius: 14, padding: 20,
              border: '1px solid #e8ecf0',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f2d3d', marginBottom: 10, margin: '0 0 10px' }}>
                💡 Comment ça marche ?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {[
                  { step: '1', text: 'Uploadez vos documents' },
                  { step: '2', text: 'Recevez votre rapport' },
                  { step: '3', text: 'Score, risques et conseils' },
                ].map((s) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      minWidth: 24, height: 24, borderRadius: '50%', background: '#2a7d9c',
                      color: '#fff', fontSize: 11, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{s.step}</span>
                    <span style={{ fontSize: 13, color: '#475569' }}>{s.text}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e8ecf0' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f2d3d', margin: '0 0 2px' }}>
                  À partir de 4,90 €
                </p>
                <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                  Résultats en quelques minutes
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── RESPONSIVE STYLES ── */}
      <style>{`
        @media (max-width: 900px) {
          .guide-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
