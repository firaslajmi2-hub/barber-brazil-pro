import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram, MapPin, Phone, Scissors, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BookingForm } from "@/components/site/BookingForm";
import {
  DAY_NAMES,
  formatPrice,
  formatTime,
  galleryQuery,
  reviewsQuery,
  servicesQuery,
  settingsQuery,
  workingHoursQuery,
} from "@/lib/site-data";

import heroBarber from "@/assets/hero-barber.jpg";
import work1 from "@/assets/work-1.jpg";
import work2 from "@/assets/work-2.jpg";
import work3 from "@/assets/work-3.jpg";
import work4 from "@/assets/work-4.jpg";
import work5 from "@/assets/work-5.jpg";
import work6 from "@/assets/work-6.jpg";

const fallbackGallery = [work1, work3, work2, work6, work4, work5];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BRAZIIILYY — Premium Brazilian Barber & Online Booking" },
      {
        name: "description",
        content:
          "Brazilian-style fades, mullets and razor beard work. Browse services and prices, then book your appointment online in seconds.",
      },
      { property: "og:title", content: "BRAZIIILYY — Premium Brazilian Barber" },
      {
        property: "og:description",
        content: "Precision fades, mullets and beard design. Book your chair online.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const settings = useQuery(settingsQuery);
  const services = useQuery(servicesQuery);
  const gallery = useQuery(galleryQuery);
  const reviews = useQuery(reviewsQuery);
  const hours = useQuery(workingHoursQuery);

  const s = settings.data;
  const barberName = s?.barber_name ?? "BRAZIIILYY";
  const heroImage = s?.hero_image_url || heroBarber;
  const instagram = s?.instagram_url || "https://www.instagram.com/_braziiilyy___244__/";
  const galleryItems =
    gallery.data && gallery.data.length > 0
      ? gallery.data.map((g) => ({ url: g.image_url, caption: g.caption }))
      : fallbackGallery.map((url) => ({ url, caption: "" }));

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#top" className="flex items-center gap-2">
            {s?.logo_url ? (
              <img src={s.logo_url} alt={barberName} className="h-8 w-auto" width={32} height={32} />
            ) : (
              <Scissors className="size-5 text-primary" />
            )}
            <span className="font-display text-xl tracking-[0.18em] text-foreground">{barberName}</span>
          </a>
          <nav className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground md:flex">
            <a href="#services" className="transition-colors hover:text-primary">
              Services
            </a>
            <a href="#gallery" className="transition-colors hover:text-primary">
              Gallery
            </a>
            <a href="#reviews" className="transition-colors hover:text-primary">
              Reviews
            </a>
            <a href="#contact" className="transition-colors hover:text-primary">
              Contact
            </a>
          </nav>
          <Button variant="gold" size="sm" asChild>
            <a href="#booking">Book</a>
          </Button>
        </div>
      </header>

      {/* HERO */}
      <section id="top" className="relative min-h-screen overflow-hidden pt-20">
        <img
          src={heroImage}
          alt={`${barberName} in the barbershop`}
          width={1280}
          height={1600}
          className="absolute inset-0 size-full object-cover object-top opacity-60"
        />
        <div className="absolute inset-0" style={{ backgroundImage: "var(--gradient-night)" }} />
        <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-end px-5 pb-20">
          <p className="eyebrow animate-fade-in">Brazilian barber culture · 244</p>
          <h1 className="animate-fade-up mt-4 text-6xl leading-[0.9] sm:text-8xl">
            <span className="text-gold-gradient animate-shine">{barberName}</span>
          </h1>
          <p className="animate-fade-up mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            {s?.slogan || "Cortes de nível brasileiro — precisão, estilo e atitude."}
          </p>
          <div className="animate-fade-up mt-9 flex flex-wrap gap-3">
            <Button variant="gold" size="xl" asChild>
              <a href="#booking">Book Appointment</a>
            </Button>
            <Button variant="night" size="xl" asChild>
              <a href={instagram} target="_blank" rel="noreferrer noopener">
                <Instagram className="mr-2 size-4" /> Instagram
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div className="relative">
            <img
              src={work3}
              alt="Sharp fade haircut profile"
              loading="lazy"
              width={900}
              height={1100}
              className="w-full rounded-xl object-cover shadow-deep"
            />
            <div className="absolute -bottom-6 -right-4 rounded-xl border border-border bg-surface-2 px-6 py-4 shadow-gold">
              <p className="font-display text-3xl text-primary">6+</p>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Years on the chair</p>
            </div>
          </div>
          <div>
            <p className="eyebrow">The barber</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Street style, luxury finish</h2>
            <div className="hairline my-6" />
            <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
              {s?.about_text ||
                "Barbeiro apaixonado por cortes modernos: mid fade, mullet, curly fade e desenhos livres."}
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="border-y border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Services & prices</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">Choose your cut</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {services.data?.map((service) => (
              <div
                key={service.id}
                className="panel group flex items-start justify-between gap-6 p-6 transition-all duration-300 hover:border-primary/60 hover:shadow-gold"
              >
                <div>
                  <h3 className="text-2xl text-foreground">{service.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {service.duration_minutes} min
                  </p>
                </div>
                <span className="font-display text-3xl text-primary">{formatPrice(service.price)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">Gallery</p>
        <h2 className="mt-3 text-4xl sm:text-5xl">Fresh work</h2>
        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3">
          {galleryItems.map((item, i) => (
            <figure key={`${item.url}-${i}`} className="group relative overflow-hidden rounded-lg">
              <img
                src={item.url}
                alt={item.caption || "Barber work"}
                loading="lazy"
                width={900}
                height={1100}
                className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {item.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-background/80 px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="border-y border-border bg-surface/40 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Reviews</p>
          <h2 className="mt-3 text-4xl sm:text-5xl">What clients say</h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {reviews.data?.map((review) => (
              <blockquote key={review.id} className="panel p-6">
                <div className="flex gap-1 text-primary">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">"{review.comment}"</p>
                <footer className="mt-5 text-xs uppercase tracking-[0.2em] text-foreground">
                  {review.customer_name}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* BOOKING */}
      <section id="booking" className="mx-auto max-w-3xl px-5 py-24">
        <p className="eyebrow">Reservation</p>
        <h2 className="mt-3 text-4xl sm:text-5xl">Book your chair</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Pick a date and only the free slots will show. Double bookings are impossible.
        </p>
        <div className="mt-10">
          {services.data && services.data.length > 0 ? (
            <BookingForm services={services.data} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading services…</p>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="border-t border-border bg-surface/40 py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-2">
          <div>
            <p className="eyebrow">Find me</p>
            <h2 className="mt-3 text-4xl sm:text-5xl">Location & contact</h2>
            <div className="mt-8 space-y-4 text-sm text-muted-foreground">
              <p className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 text-primary" />
                {s?.address}
              </p>
              <p className="flex items-start gap-3">
                <Phone className="mt-0.5 size-4 text-primary" />
                <a href={`tel:${s?.phone ?? ""}`} className="hover:text-primary">
                  {s?.phone}
                </a>
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="gold" asChild>
                <a href={instagram} target="_blank" rel="noreferrer noopener">
                  <Instagram className="mr-2 size-4" /> Follow on Instagram
                </a>
              </Button>
              {s?.map_url ? (
                <Button variant="night" asChild>
                  <a href={s.map_url} target="_blank" rel="noreferrer noopener">
                    Open in Maps
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
          <div className="panel p-6">
            <p className="eyebrow">Opening hours</p>
            <ul className="mt-5 space-y-2 text-sm">
              {hours.data?.map((day) => (
                <li key={day.day_of_week} className="flex justify-between border-b border-border/60 pb-2">
                  <span className="text-muted-foreground">{DAY_NAMES[day.day_of_week]}</span>
                  <span className={day.is_closed ? "text-destructive" : "text-foreground"}>
                    {day.is_closed
                      ? "Closed"
                      : `${formatTime(day.open_time)} – ${formatTime(day.close_time)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-xs uppercase tracking-[0.2em] text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} {barberName}</span>
          <Link to="/admin" className="hover:text-primary">
            Barber login
          </Link>
        </div>
      </footer>
    </div>
  );
}
