# 🎳 BOWLING APP - DESIGN SYSTEM "STELLA STYLE"

## Overview
Design pulito, sportivo e accogliente ispirato al "Stella Bowling Club".
Palette azzurro-celeste con accenti oro, stile moderno e professionale.

---

## 🎨 PALETTE COLORI

### Colori Principali
```
Primary (Azzurro):      #5DADE2  // Header, elementi primari, link
Secondary (Oro):        #F8B500  // Bottoni CTA, accenti, badge premium
Dark Blue (Testo):      #2C3E50  // Titoli, testo importante, icone
Light Blue (Hover):     #3498DB  // Stati hover azzurro più scuro

Neutral Colors:
- White:       #FFFFFF  // Background card, contenuti
- Light Gray:  #F5F5F5  // Background pagina
- Gray 100:    #ECEFF1  // Background secondario
- Gray 300:    #CFD8DC  // Bordi, divider
- Gray 500:    #90A4AE  // Testo secondario
- Gray 700:    #546E7A  // Testo normale
- Gray 900:    #263238  // Testo scuro

Colori Semantici:
- Success:  #4CAF50  // Verde
- Warning:  #FF9800  // Arancione
- Error:    #F44336  // Rosso
- Info:     #2196F3  // Blu info
```

### Colori Categorie Giocatori
```
U12:      #4CAF50 (Verde brillante)
U15:      #00BCD4 (Ciano)
U18:      #2196F3 (Blu brillante)
SENIOR_A: #F8B500 (Oro - top categoria)
SENIOR_B: #FFA726 (Arancione chiaro)
SENIOR_C: #9C27B0 (Viola)
SENIOR_D: #78909C (Grigio-blu)
```

---

## 📝 TIPOGRAFIA

### Font Family
```
- Font principale: 'Roboto', 'Open Sans', sans-serif
- Font alternativo: 'Montserrat', sans-serif (titoli)
- Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif
```

### Scala Tipografica
```
H1 (Page Title):        36px / 2.25rem - font-bold - Montserrat
H2 (Section Title):     28px / 1.75rem - font-bold - Montserrat
H3 (Card Title):        20px / 1.25rem - font-semibold
Body Large:             16px / 1rem    - font-normal
Body:                   15px / 0.9375rem - font-normal
Small:                  13px / 0.8125rem - font-normal
Tiny (labels):          11px / 0.6875rem - font-medium - uppercase
```

---

## 🧱 COMPONENTI

### 1. BUTTONS

#### Primary Button (Oro/Giallo)
```css
Background: bg-[#F8B500]
Hover: bg-[#E5A600]
Text: text-white
Padding: px-8 py-3
Border Radius: rounded-md (6px)
Font: text-base font-bold uppercase
Shadow: shadow-md hover:shadow-lg
Transform: hover:scale-105
Transition: transition-all duration-200
```

#### Secondary Button (Azzurro)
```css
Background: bg-[#5DADE2]
Hover: bg-[#3498DB]
Text: text-white
Padding: px-8 py-3
Border Radius: rounded-md
Font: text-base font-semibold
Shadow: shadow hover:shadow-md
```

#### Outline Button
```css
Background: bg-white
Border: border-2 border-[#F8B500]
Hover Background: hover:bg-[#F8B500]
Text: text-[#F8B500] hover:text-white
Padding: px-8 py-3
Border Radius: rounded-md
Font: font-semibold
```

### 2. CARDS

#### Standard Card (con bordo oro)
```css
Background: bg-white
Border: border-2 border-[#F8B500]
Border Radius: rounded-lg (8px)
Padding: p-6
Shadow: shadow-sm hover:shadow-xl
Transition: transition-all duration-300
```

#### Match Card (Prossime Partite)
```css
Background: bg-white
Border: border border-gray-200
Border Radius: rounded-lg
Padding: p-5
Shadow: shadow hover:shadow-lg
Layout: Vertical center con "VS" tra le squadre
Icon: Birilli blu scuro #2C3E50
```

#### Stat Card (Dashboard)
```css
Background: bg-gradient-to-br from-[#5DADE2] to-[#3498DB]
Border Radius: rounded-xl (12px)
Padding: p-6
Text Color: text-white
Shadow: shadow-lg
Icon: Bianco/Giallo
```

### 3. NAVBAR

#### Header Style (Stella)
```css
Background: bg-gradient-to-r from-[#5DADE2] to-[#3498DB]
Height: h-20
Shadow: shadow-lg
Padding: px-6 lg:px-12

Logo:
- Size: h-16
- Position: Left
- Include bandiera italiana 🇮🇹

Title:
- Font: text-2xl font-bold Montserrat uppercase
- Color: text-white
- Letter Spacing: tracking-wide

Menu Items:
- Color: text-white
- Hover: bg-white/20 rounded-md
- Active: bg-white/30 font-semibold
- Padding: px-4 py-2
- Font: font-semibold uppercase text-sm
```

### 4. BADGES & TAGS

#### Gold Badge (Premium/Featured)
```css
Background: bg-gradient-to-r from-[#F8B500] to-[#FFD700]
Text: text-white
Padding: px-4 py-1.5
Border Radius: rounded-full
Font: text-xs font-bold uppercase
Icon: ⭐ stella bianca
```

#### Category Badge
```css
Padding: px-3 py-1
Border Radius: rounded-md
Border: border-2 border-current
Font: text-xs font-bold uppercase
// Colori trasparenti con bordo colorato
```

### 5. CLASSIFICHE (Rankings)

#### Ranking Item
```css
Background: bg-white
Border: border-l-4 border-[#F8B500] (oro per top 3)
Padding: p-4
Margin: mb-2
Shadow: shadow-sm hover:shadow-md
Transition: all 0.2s

Star Icon:
- Color: #F8B500 (filled for top)
- Color: #E0E0E0 (outline for others)
- Size: w-6 h-6
```

### 6. FORM INPUTS

```css
Background: bg-white
Border: border-2 border-gray-300
Focus Border: focus:border-[#5DADE2]
Focus Ring: focus:ring-4 focus:ring-[#5DADE2]/20
Border Radius: rounded-md
Padding: px-4 py-3
Text: text-gray-900
Placeholder: placeholder-gray-400
```

### 7. ALERTS

#### Info Alert (Azzurro)
```css
Background: bg-blue-50
Border: border-l-4 border-[#5DADE2]
Text: text-blue-900
Icon: Info circle azzurro
```

#### Success Alert
```css
Background: bg-green-50
Border: border-l-4 border-green-500
Text: text-green-900
Icon: Check circle verde
```

---

## 🎭 ICONOGRAFIA

### Icone Bowling
```
Birilli (Team): 🎳 o icona SVG blu scuro #2C3E50
Stella (Rating): ⭐ colore oro #F8B500
Trofeo: 🏆 oro
Medaglie: 🥇🥈🥉
```

### Libreria Icone
Lucide React o Heroicons - colore primario #2C3E50

---

## 📐 LAYOUT

### Container
```css
Max Width: max-w-7xl (1280px)
Padding: px-4 md:px-6 lg:px-12
Margin: mx-auto
```

### Section Spacing
```css
Between sections: py-12 md:py-16
Within sections: space-y-6 md:space-y-8
```

### Grid System
```css
Mobile: grid-cols-1
Tablet: grid-cols-2 (md:)
Desktop: grid-cols-3 o grid-cols-4 (lg:)
Gap: gap-6 md:gap-8
```

---

## 🎨 STILE SPECIFICO "STELLA"

### Match Cards (Prossime Partite)
```jsx
<div class="bg-white border border-gray-200 rounded-lg p-5 shadow hover:shadow-lg transition">
  <div class="flex items-center justify-between">
    <!-- Team 1 -->
    <div class="flex-1 text-center">
      <div class="w-12 h-12 mx-auto mb-2">
        🎳 <!-- Icona birilli blu scuro -->
      </div>
      <p class="font-bold text-gray-900">Mon Drille</p>
      <p class="text-sm text-gray-600">Cesena Coriano</p>
      <p class="text-xs text-gray-500">22/09 19:00</p>
    </div>
    
    <!-- VS -->
    <div class="px-4">
      <span class="font-bold text-gray-400 text-lg">VS</span>
    </div>
    
    <!-- Team 2 -->
    <div class="flex-1 text-center">
      <div class="w-12 h-12 mx-auto mb-2">
        🎳
      </div>
      <p class="font-bold text-gray-900">Collur Cenin</p>
      <p class="text-sm text-gray-600">Val Maro</p>
      <p class="text-xs text-gray-500">22/09 19:30</p>
    </div>
  </div>
  
  <!-- Bottone Prenota -->
  <button class="w-full mt-4 bg-[#F8B500] hover:bg-[#E5A600] text-white font-bold py-2.5 rounded-md uppercase text-sm transition">
    Prenota Ora
  </button>
</div>
```

### Classifica Item
```jsx
<div class="bg-white border-l-4 border-[#F8B500] p-4 shadow-sm hover:shadow-md transition flex items-center justify-between">
  <div class="flex items-center gap-3">
    <span class="text-[#F8B500] text-2xl">⭐</span>
    <span class="font-bold text-gray-900">Stlin d Autümno</span>
  </div>
  <span class="text-[#F8B500] text-xl">⭐</span>
</div>
```

---

## 🎯 TAILWIND CONFIG

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#5DADE2',
        secondary: '#F8B500',
        dark: '#2C3E50',
        'light-blue': '#3498DB'
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif']
      },
      borderRadius: {
        'md': '6px',
        'lg': '8px',
        'xl': '12px'
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.15)'
      }
    }
  }
}
```

---

## ✨ DIFFERENZE CHIAVE dallo Stile Precedente

| Aspetto | Stile Precedente | Stile Stella |
|---------|------------------|--------------|
| Colore Primario | Blu Navy scuro | Azzurro chiaro |
| Accento | Arancione | Oro/Giallo |
| Atmosfera | Professionale formale | Sportivo accogliente |
| Bordi Card | Sottili grigi | Oro evidenti |
| Bottoni | Blu scuro | Giallo oro prominente |
| Background | Grigio freddo | Bianco luminoso |
| Font | Inter | Roboto + Montserrat |

---

## 📋 ESEMPI CODICE

### Header Stella Style
```jsx
<header className="bg-gradient-to-r from-[#5DADE2] to-[#3498DB] shadow-lg">
  <div className="container mx-auto px-6 lg:px-12">
    <div className="flex justify-between items-center h-20">
      
      <div className="flex items-center gap-4">
        <img src="/logo.png" alt="Logo" className="h-16" />
        <div>
          <h1 className="text-white text-2xl font-bold font-heading uppercase tracking-wide">
            STELLA BOWLING CLUB
          </h1>
        </div>
      </div>
      
      <nav className="hidden lg:flex gap-2">
        <a href="#" className="text-white font-semibold uppercase text-sm px-4 py-2 bg-white/30 rounded-md">
          HOME ⭐
        </a>
        <a href="#" className="text-white font-semibold uppercase text-sm px-4 py-2 hover:bg-white/20 rounded-md transition">
          PRENOTAZIONE
        </a>
        <a href="#" className="text-white font-semibold uppercase text-sm px-4 py-2 hover:bg-white/20 rounded-md transition">
          CLASSIFICHE
        </a>
        <a href="#" className="text-white font-semibold uppercase text-sm px-4 py-2 hover:bg-white/20 rounded-md transition">
          PROFILO ⭐
        </a>
      </nav>
      
    </div>
  </div>
</header>
```

### Gold Button
```jsx
<button className="bg-[#F8B500] hover:bg-[#E5A600] text-white font-bold py-3 px-8 rounded-md uppercase shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200">
  Prenota Ora
</button>
```

---

## 🎨 NOTE DESIGN

- **Atmosfera**: Accogliente, sportivo, energico
- **Target**: Club amatoriali e semi-professionali
- **Stile**: Moderno ma non troppo minimal, caldo e friendly
- **Colori**: Azzurro trasmette fiducia e sport, oro trasmette qualità
- **Font**: Roboto è friendly e leggibile, Montserrat per titoli impattanti

---

## 📱 RESPONSIVE

Stesso approccio mobile-first:
- Mobile: 1 colonna, bottoni full-width
- Tablet: 2 colonne
- Desktop: 3-4 colonne, header orizzontale

---

## ✅ CHECKLIST IMPLEMENTAZIONE

- [ ] Importare Roboto e Montserrat da Google Fonts
- [ ] Configurare Tailwind con colori #5DADE2 e #F8B500
- [ ] Creare componente Button oro e azzurro
- [ ] Creare Card con bordo oro
- [ ] Implementare header gradient azzurro
- [ ] Aggiungere icone birilli e stelle
- [ ] Testare contrasto testo su azzurro (WCAG)
