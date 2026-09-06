import { Header } from "@/components/site/header";
import { TitleScreen } from "@/components/site/title-screen";
import { Footer } from "@/components/site/footer";
import { ContactForm } from "@/features/contact/contact-form";
import { BallisticStory } from "@/features/ballistic-story/components/ballistic-story";
import { ProductSection } from "@/features/product/components/product-section";
import { SmoothScroll } from "@/components/site/smooth-scroll";
export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main id="main">
        <TitleScreen />
        <BallisticStory />
        <ProductSection />
        <section id="contact" className="contact-section section-pad">
          <div className="contact-heading">
            <p className="eyebrow">
              <span className="signal-dot" /> The next conversation
            </p>
            <h2 className="section-heading">
              LET’S TALK ABOUT
              <br />
              WHAT YOU NEED
              <br />
              <span>TO PROTECT.</span>
            </h2>
            <p>
              For product questions, potential applications,
              <br />
              and the possibilities ahead.
            </p>
          </div>
          <ContactForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
