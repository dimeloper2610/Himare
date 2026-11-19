# Himarë: Casa Bella & Μικρή Χιμάρα

Ενημερωτικό site για δύο καταλύματα στη Χιμάρα (Αλβανία) του Superhost Pol:

- **Casa Bella: σπίτι με μυστικό κήπο** · ολόκληρο κατάλυμα, έως 4 άτομα · [Airbnb](https://www.airbnb.gr/rooms/1404415852625597128)
- **Μικρή Χιμάρα** · ιδιωτικό δωμάτιο, έως 2 άτομα · [Airbnb](https://www.airbnb.gr/rooms/880163057785084192)

Στατικό site (HTML/CSS/JS, χωρίς build), φτιαγμένο πρώτα για κινητό: animations, gallery με swipe, κάτω μπάρα πλοήγησης, κουμπί κράτησης, διακόπτης Μέρα/Νύχτα, σύγκριση καταλυμάτων, συχνές ερωτήσεις, ελληνικά/αγγλικά, εγκατάσταση ως εφαρμογή (PWA).

## Τοπικά

```bash
python3 -m http.server 8000
```

Μετά ανοίξτε http://localhost:8000

## Δημοσίευση (GitHub Pages)

Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`.

## Δομή

- `index.html`: η σελίδα (ελληνικό κείμενο). Ένα κατάλυμα τη φορά (διακόπτης Casa Bella / Μικρή Χιμάρα, tabs Επισκόπηση / Παροχές / Κριτικές). Link για το δεύτερο: `/#mikri-himara`
- `assets/js/main.js`: gallery/lightbox και αγγλικές μεταφράσεις
- `assets/css/style.css`: εμφάνιση
- `assets/img/<κατάλυμα>/`: φωτογραφίες (1280px), `thumb/`: μικρογραφίες (640px)

Τα στοιχεία, οι βαθμολογίες και οι κριτικές πάρθηκαν από τις σελίδες Airbnb τον Νοέμβριο 2026.
