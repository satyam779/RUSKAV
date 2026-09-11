import { useEffect, useState } from "react";
import { useFrameSequence } from "./hooks/useFrameSequence";
import { Loader } from "./components/Loader";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { TrustStrip } from "./components/TrustStrip";
import { About } from "./components/About";
import { CategoryGrid } from "./components/CategoryGrid";
import { CategoryShowcase } from "./components/CategoryShowcase";
import { Sustainability } from "./components/Sustainability";
import { Quality } from "./components/Quality";
import { Contact } from "./components/Contact";
import { Footer } from "./components/Footer";
import { categories } from "./data/catalogue";

function App() {
  const { progress, ready, images } = useFrameSequence();
  const [loaderVisible, setLoaderVisible] = useState(true);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => setLoaderVisible(false), 400);
    return () => clearTimeout(t);
  }, [ready]);

  useEffect(() => {
    document.body.style.overflow = loaderVisible ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loaderVisible]);

  return (
    <>
      <Loader progress={progress} visible={loaderVisible} />

      <Header />
      <main>
        <Hero images={images} ready={ready} />
        <TrustStrip />
        <About />
        <CategoryGrid />
        {categories.map((c, i) => (
          <CategoryShowcase key={c.id} category={c} reverse={i % 2 === 1} />
        ))}
        <Sustainability />
        <Quality />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
