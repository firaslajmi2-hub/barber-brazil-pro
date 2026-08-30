import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/site/BookingForm";
import {
  DAY_NAMES,
  formatPrice,
  formatTime,
  galleryQuery,
  servicesQuery,
  settingsQuery,
  workingHoursQuery,
} from "@/lib/site-data";

import heroPhoto from "@/assets/street-hero.jpg";
import street1 from "@/assets/street-1.jpg";
import street2 from "@/assets/street-2.jpg";
import street3 from "@/assets/street-3.jpg";
import street4 from "@/assets/street-4.jpg";

const fallbackGallery = [street1, street3, street4, street2];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BRAZIIILYY — Street Barber · Fresh Cuts, Real Style" },
      {
        name: "description",
        content:
          "Home barber with Brazilian street style. Fades, beard lines and hair designs from 15 TND. Book your time online in a few taps.",
      },
      { property: "og:title", content: "BRAZIIILYY — Street Barber" },
      {
        property: "og:description",
        content: "Fresh cuts. Real style. Haircut from 15 TND — book online.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const settings = useQuery(settingsQuery);
  const services = useQuery(servicesQuery);
  const gallery = useQuery(galleryQuery);
  const hours = useQuery(workingHoursQuery);

  const s = settings.data;
  const barberName = s?.barber_name ?? "BRAZIIILYY";
  const heroImage = s?.hero_image_url || heroPhoto;
  const instagram = s?.instagram_url || "https://www.instagram.com/_braziiilyy___244__/";
  const galleryItems =
    gallery.data && gallery.data.length > 0
      ? gallery.data.map((g) => ({ url: g.image_url, caption: g.caption }))
      : fallbackGallery.map((url) => ({ url, caption: "" }));

  return (
    <div className="min-h-screen bg-background">
      {/* HERO */}
      <section className="relative">
        <img
          src={heroImage}
          alt={`${barberName} cutting hair`}
          width={1088}
          height={1360}
          className="h-[78vh] w-full object-cover object-center"
        />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--gradient-night)" }} />

        {/* discreet admin entry */}
        <Link
          to="/admin"
          aria-label="Admin"
          className="absolute right-3 top-3 text-[10px] uppercase tracking-widest text-foreground/25 transition-colors hover:text-primary"
        >
          Admin
        </Link>

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-3xl px-5 pb-10">
          <h1 className="text-5xl leading-none sm:text-7xl">{barberName}</h1>
          <p className="mt-3 text-base text-foreground/80">
            {s?.slogan || "Fresh cuts. Real style."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="gold" size="lg" asChild>
              <a href="#booking">Book Now</a>
            </Button>
            <Button variant="night" size="lg" asChild>
              <a href={instagram} target="_blank" rel="noreferrer noopener">
                <Instagram className="mr-2 size-4" /> Instagram
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* SERVICES + PRICES */}
      <section id="services" className="mx-auto max-w-3xl px-5 py-14">
        <h2 className="text-3xl">Services</h2>
        <ul className="mt-6 divide-y divide-border">
          {services.data?.map((service) => (
            <li key={service.id} className="flex items-baseline justify-between gap-4 py-4">
              <div>
                <p className="font-display text-xl">{service.name}</p>
                {service.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">{service.duration_minutes} min</p>
              </div>
              <span className="font-display text-2xl text-primary">{formatPrice(service.price)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="mx-auto max-w-3xl px-5 pb-14">
        <h2 className="text-3xl">Cuts</h2>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {galleryItems.map((item, i) => (
            <img
              key={`${item.url}-${i}`}
              src={item.url}
              alt={item.caption || "Haircut"}
              loading="lazy"
              width={1080}
              height={1080}
              className="aspect-square w-full object-cover"
            />
          ))}
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" className="border-t border-border bg-surface/40 py-14">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-3xl">Book a time</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only free hours show up. One chair, no double bookings.
          </p>
          <div className="mt-6">
            {services.data && services.data.length > 0 ? (
              <BookingForm services={services.data} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading services…</p>
            )}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="mx-auto max-w-3xl px-5 py-14">
        <h2 className="text-3xl">Where & when</h2>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <div className="space-y-3 text-sm text-muted-foreground">
            {s?.address ? (
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-accent" />
                {s.address}
              </p>
            ) : null}
            {s?.phone ? (
              <p className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 text-accent" />
                <a href={`tel:${s.phone}`} className="hover:text-primary">
                  {s.phone}
                </a>
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="gold" size="sm" asChild>
                <a href={instagram} target="_blank" rel="noreferrer noopener">
                  <Instagram className="mr-2 size-4" /> Follow
                </a>
              </Button>
              {s?.map_url ? (
                <Button variant="night" size="sm" asChild>
                  <a href={s.map_url} target="_blank" rel="noreferrer noopener">
                    Maps
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <ul className="space-y-1 text-sm">
            {hours.data?.map((day) => (
              <li key={day.day_of_week} className="flex justify-between">
                <span className="text-muted-foreground">{DAY_NAMES[day.day_of_week]}</span>
                <span className={day.is_closed ? "text-muted-foreground" : "text-foreground"}>
                  {day.is_closed
                    ? "Closed"
                    : `${formatTime(day.open_time)} – ${formatTime(day.close_time)}`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-border py-6">
        <p className="mx-auto max-w-3xl px-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {barberName}
        </p>
      </footer>
    </div>
  );
}
