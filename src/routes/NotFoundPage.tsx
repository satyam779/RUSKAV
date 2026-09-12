import { useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader, Section, buttonClass } from "../components/ui";

export function NotFoundPage() {
  useEffect(() => {
    document.title = "Page not found | Ruskav Food Service Products";
  }, []);

  return (
    <>
      <PageHeader
        kicker="404"
        title="That page isn't here."
        intro="The link may be out of date, or the product code may have changed. The range is all still here."
        tone="dim"
      />
      <Section className="bg-paper pt-10 md:pt-14">
        <div className="flex flex-wrap gap-3">
          <Link to="/" className={buttonClass("primary")}>
            Back to home
          </Link>
          <Link to="/products" className={buttonClass("outline")}>
            Browse the range
          </Link>
          <Link to="/shop" className={buttonClass("outline")}>
            Search the shop
          </Link>
          <Link to="/contact" className={buttonClass("quiet")}>
            Contact us
          </Link>
        </div>
      </Section>
    </>
  );
}
