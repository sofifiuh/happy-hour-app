// GENERATED FILE — do not edit by hand. Regenerate with: node pipeline/writeback.js
//
// Machine-written data layer merged over the hand-verified seed at app seed
// time (see sampleVenues() in app.js):
// - VENUES_EXTRACTED: per-venue deal lists read from each venue's own
//   official menu, applied ONLY where the automated read reproduced the
//   hand-verified schedule exactly (corroboration). Source page credited
//   per venue. The verified happy_hour schedule itself is never changed here.
// - VENUES_DISCOVERED: venues from pipeline/discovered.json (the committed
//   store maintained by pipeline/discover.js + writeback), verified: false
//   until a human checks them.
// - VENUES_PLACES: Google Places identity fields (place_id, rating, review
//   count, price level) from pipeline/places-sync.js. Refreshed by the
//   re-sync loop per Google's caching terms; place_id is the one field
//   that may be stored indefinitely.
const EXTRACTED_DATA_VERSION = "2026-08-30-c9b38209";

const VENUES_EXTRACTED = {
  "ancora": {
    "deals": [
      {
        "name": "HH Highball",
        "price": "$7",
        "category": "drink",
        "description": "1 oz vodka, tequila, gin or rum"
      },
      {
        "name": "Draught beer",
        "price": "$8",
        "category": "drink",
        "description": "16 oz Granville Island Lager, Pale Ale, or IPA"
      },
      {
        "name": "Aperol Spritz",
        "price": "$12",
        "category": "drink",
        "description": "3 oz — Aperol, Prosecco, soda, orange"
      },
      {
        "name": "Caesar",
        "price": "$12",
        "category": "drink",
        "description": "1 oz Smirnoff vodka, Clamato, Tabasco, Worcestershire"
      },
      {
        "name": "Bottega Prosecco",
        "price": "$10",
        "category": "drink",
        "description": "5 oz; 8 oz $16, bottle $50"
      },
      {
        "name": "Franca Estate Riesling",
        "price": "$10",
        "category": "drink",
        "description": "5 oz; 8 oz $16, bottle $50"
      },
      {
        "name": "Phoenix Sauvignon Blanc",
        "price": "$11",
        "category": "drink",
        "description": "5 oz; 8 oz $17, bottle $55"
      },
      {
        "name": "Franca Estate Pinot Noir",
        "price": "$14",
        "category": "drink",
        "description": "5 oz; 8 oz $20, bottle $70"
      },
      {
        "name": "Phoenix Cabernet Merlot",
        "price": "$11",
        "category": "drink",
        "description": "5 oz; 8 oz $17, bottle $55"
      },
      {
        "name": "Franca Estate Rosé",
        "price": "$10",
        "category": "drink",
        "description": "5 oz; 8 oz $16, bottle $50"
      },
      {
        "name": "Spicy Tuna Cone",
        "price": "$9",
        "category": "food",
        "description": "Happy hour seafood & sharing item"
      },
      {
        "name": "Truffle Fries",
        "price": "$10",
        "category": "food",
        "description": "Grana Padano, miso aioli"
      },
      {
        "name": "Brussels Sprouts",
        "price": "$10",
        "category": "food",
        "description": "Togarashi, lemon"
      },
      {
        "name": "Prawn Tempura Cone",
        "price": "$10",
        "category": "food",
        "description": "Happy hour seafood & sharing item"
      },
      {
        "name": "Premium Oysters",
        "price": "$3 ea",
        "category": "food",
        "description": "1 pc $3 / 6 pc $18"
      },
      {
        "name": "Summer Salad",
        "price": "$17",
        "category": "food",
        "description": "Tender greens, pea tendrils, market vegetables, grilled lemon vinaigrette, pangrattato"
      },
      {
        "name": "Ancora Burger",
        "price": "$22",
        "category": "food",
        "description": "AAA beef patty, house brioche, miso mayo, Riopelle cheese, crispy caramelized onions, romaine, heirloom tomato, fries"
      },
      {
        "name": "Mussels",
        "price": "$22",
        "category": "food",
        "description": "Japanese curry cream sauce, fresh coriander, toasted focaccia"
      },
      {
        "name": "Sushi Pizza",
        "price": "$24",
        "category": "food",
        "description": "Crispy rice, avocado, Dungeness crab, tuna, sockeye salmon, unagi sauce"
      },
      {
        "name": "Ancora Glacier",
        "price": "$93",
        "category": "food",
        "description": "For 2 — poached lobster tail, shucked oysters, scallop shooters, prawn cocktail, tuna tartare and tataki, assorted sashimi, seaweed salad"
      }
    ],
    "source_url": "https://www.ancoradining.com/falsecreek",
    "extracted_at": "2026-08-30"
  },
  "hapa-izakaya-yaletown": {
    "deals": [
      {
        "name": "Draft beer",
        "price": "$5",
        "category": "drink",
        "description": "14oz draft"
      },
      {
        "name": "Wine",
        "price": "$6",
        "category": "drink",
        "description": "6oz glass"
      },
      {
        "name": "Shochu sour highball",
        "price": "$5",
        "category": "drink",
        "description": "Single; $8 double. Choice of lemon, lime or yuzu. Upgrade to house strawberry syrup for $1 extra"
      },
      {
        "name": "House sake takezake",
        "price": "$5 off",
        "category": "drink",
        "description": "Hapa signature chilled sake served in frozen bamboo"
      },
      {
        "name": "Select house cocktail",
        "price": "$3 off",
        "category": "drink",
        "description": "Select house cocktails"
      },
      {
        "name": "Edamame",
        "price": "$8",
        "category": "food",
        "description": "Hapa's original marinated chilled soybeans"
      },
      {
        "name": "Beef tataki",
        "price": "$10",
        "category": "food",
        "description": "Lightly seared AAA beef, sesame chili sauce"
      },
      {
        "name": "Ebi mayo",
        "price": "$11",
        "category": "food",
        "description": "Tempura prawn, tobanjan mayo sauce"
      },
      {
        "name": "Negitoro",
        "price": "$10",
        "category": "food",
        "description": "Chopped albacore tuna belly, green onions, toasted garlic bread"
      },
      {
        "name": "Takoyaki",
        "price": "$9",
        "category": "food",
        "description": "Lightly fried octopus fritters, green onions, Japanese mayonnaise, BBQ sauce"
      },
      {
        "name": "Renkon gyoza tempura",
        "price": "$10",
        "category": "food",
        "description": "Minced pork sandwiched between lotus root slices, tempura batter"
      },
      {
        "name": "Avocado taku roll",
        "price": "$10",
        "category": "food",
        "description": "Pickled daikon, avocado, asparagus"
      },
      {
        "name": "Spicy tuna roll",
        "price": "$12",
        "category": "food",
        "description": "Chopped tuna, cucumber, tempura bits, spicy chili sauce"
      },
      {
        "name": "Spicy pork ishi-yaki",
        "price": "$13",
        "category": "food",
        "description": "Rice, spicy miso minced pork, garlic sprouts, egg, tomato, lettuce; served in a hot stone bowl"
      },
      {
        "name": "Kinoko ishi-yaki",
        "price": "$13",
        "category": "food",
        "description": "Rice, enoki, shiitake, oyster mushrooms, iwanori; served in a hot stone bowl"
      },
      {
        "name": "Chipotle beef curry ishi-yaki",
        "price": "$13",
        "category": "food",
        "description": "Rice, AAA beef, chipotle curry, lettuce, tomato, mozzarella cheese, fried egg; served in a hot stone bowl"
      },
      {
        "name": "Teriyaki chicken ishi-yaki",
        "price": "$13",
        "category": "food",
        "description": "Rice, teriyaki chicken, lettuce, tomato, mayo, crispy wonton chips; served in a hot stone bowl"
      }
    ],
    "source_url": "https://hapaizakaya.com/yaletown-menu/",
    "extracted_at": "2026-08-30"
  },
  "boulevard-kitchen-oyster-bar": {
    "deals": [
      {
        "name": "Oysters",
        "price": "$2 each",
        "category": "food",
        "description": "lemon, shallot mignonette; min 6, max 12 per person, per order"
      },
      {
        "name": "Mixed olives",
        "price": "$10",
        "category": "food",
        "description": "perello and castelvetrano olives"
      },
      {
        "name": "Baby gem lettuce wedges",
        "price": "$15",
        "category": "food",
        "description": "crispy shallot and garlic, parmesan; +$3 add guacamole"
      },
      {
        "name": "Marcona almonds",
        "price": "$8",
        "category": "food",
        "description": "black truffle infused almonds, sea salt"
      },
      {
        "name": "Local cod tacos",
        "price": "$18",
        "category": "food",
        "description": "guacamole, corn tortilla, pickled red onion, coleslaw, chili crema, cilantro"
      },
      {
        "name": "Prawn cocktail",
        "price": "$20",
        "category": "food",
        "description": "black tiger prawn, louie dressing, lemon"
      },
      {
        "name": "Tuna tataki",
        "price": "$16",
        "category": "food",
        "description": "albacore tuna, ponzu vinaigrette"
      },
      {
        "name": "Beef carpaccio",
        "price": "$19",
        "category": "food",
        "description": "soy lime vinaigrette, herb emulsion, pickled shiitake, crispy shallot, rice paper"
      },
      {
        "name": "Lemongrass chicken wings",
        "price": "$16",
        "category": "food",
        "description": "thai chili, caramel fish sauce"
      },
      {
        "name": "French fries",
        "price": "$10",
        "category": "food",
        "description": "french fries"
      },
      {
        "name": "Truffle fries",
        "price": "$15",
        "category": "food",
        "description": "truffle salsa, grana padano, chives"
      },
      {
        "name": "Cornbread",
        "price": "$10",
        "category": "food",
        "description": "cornbread"
      },
      {
        "name": "Vesper glace",
        "price": "$15",
        "category": "drink",
        "description": "2oz - the botanist islay gin, lillet blanc, grey goose la poire vodka, lemon"
      },
      {
        "name": "Espresso martini",
        "price": "$11",
        "category": "drink",
        "description": "2oz - northern keep vodka, kahlua coffee liqueur, espresso"
      },
      {
        "name": "Whisky lemonade",
        "price": "$13",
        "category": "drink",
        "description": "1.5oz - suntory toki japanese whisky, sicilian lemonade"
      },
      {
        "name": "Blood orange negroni",
        "price": "$11",
        "category": "drink",
        "description": "3oz - malfy blood orange gin, campari, vermouth"
      },
      {
        "name": "Daily special cocktail",
        "price": "$13",
        "category": "drink",
        "description": "see what the bar is up to"
      },
      {
        "name": "Select white & red wine",
        "price": "$8",
        "category": "drink",
        "description": "5oz glass; bottle $40"
      },
      {
        "name": "Bottles of wine",
        "price": "20% off",
        "category": "drink",
        "description": "20% off all bottles of wine"
      },
      {
        "name": "BLVD lager",
        "price": "$8",
        "category": "drink",
        "description": "16oz draught lager"
      },
      {
        "name": "Parkside pale ale",
        "price": "$8",
        "category": "drink",
        "description": "16oz draught pale ale"
      }
    ],
    "source_url": "https://boulevardvancouver.ca/menus/",
    "extracted_at": "2026-08-30"
  },
  "tap-barrel-convention-centre": {
    "deals": [
      {
        "name": "Tots or Fries",
        "price": "$5",
        "category": "food",
        "description": "Happy hour snack"
      },
      {
        "name": "Truffle Waffle Fries",
        "price": "$8",
        "category": "food",
        "description": "Parmesan, parsley, garlic aioli"
      },
      {
        "name": "Famous Fried Pickles",
        "price": "$9.50",
        "category": "food",
        "description": "Creamy dill dip"
      },
      {
        "name": "Tap Snack Burger",
        "price": "$10",
        "category": "food",
        "description": "Happy hour exclusive; 100% canadian beef, caramelized onions, aged white cheddar, pickles, house mayo, potato roll (snack-size, burger only)"
      },
      {
        "name": "Fried Chicken Snack Burger",
        "price": "$10",
        "category": "food",
        "description": "Happy hour exclusive; southern fried chicken, pickles, tangy mayo, potato roll (snack-size, burger only)"
      },
      {
        "name": "Gyoza",
        "price": "$10",
        "category": "food",
        "description": "Pan-fried chicken and veggie dumplings, korean sesame sauce, green onion, sriracha mustard"
      },
      {
        "name": "Fresh Guac & Chips",
        "price": "$11",
        "category": "food",
        "description": "Guacamole, pico de gallo, feta, roasted pumpkin seeds, cilantro, cumin-dusted tortilla chips"
      },
      {
        "name": "Hummus & Za'atar Flatbread",
        "price": "$13.50",
        "category": "food",
        "description": "Hummus, chermoula, feta, harissa, crispy chickpeas, parsley, baked to order za'atar flatbread"
      },
      {
        "name": "Chicken Wings",
        "price": "$15",
        "category": "food",
        "description": "Choice of frank's hot, spicy korean, maple bacon or salt and pepper"
      },
      {
        "name": "Oreo Cheesecake",
        "price": "$10",
        "category": "food",
        "description": "New york style cheesecake, oreo whip, chocolate sauce, oreo crumble"
      },
      {
        "name": "Mac & Cheese",
        "price": "$15",
        "category": "food",
        "description": "Happy hour exclusive; no protein"
      },
      {
        "name": "Margherita Pizza",
        "price": "$16.50",
        "category": "food",
        "description": "Parmesan, fresh mozzarella, fresh basil, pomodoro sauce"
      },
      {
        "name": "Double Pepperoni Pizza",
        "price": "$17.50",
        "category": "food",
        "description": "Dry-cured pepperoni, mozzarella, fresh parmesan, pomodoro sauce"
      },
      {
        "name": "Local Wild Mushroom Pizza",
        "price": "$17.50",
        "category": "food",
        "description": "Local wild mushrooms, mozzarella, truffle arugula, roasted garlic cream sauce"
      },
      {
        "name": "Hot Honey Calabrese Pizza",
        "price": "$18.50",
        "category": "food",
        "description": "Calabrese salami, bacon, fresh mozzarella, spicy honey, pomodoro sauce, fresh basil"
      },
      {
        "name": "Fennel Sausage & Stracciatella Pizza",
        "price": "$20.50",
        "category": "food",
        "description": "Fennel sausage, stracciatella, smoked mozzarella, kale, pickled peppers, roasted garlic cream sauce"
      },
      {
        "name": "Ranchero Rice Bowl",
        "price": "$19",
        "category": "food",
        "description": "Choice of grilled cajun chicken, sautéed creole prawns or cajun bbq tofu"
      },
      {
        "name": "Ahi Tuna Poke Bowl",
        "price": "$21",
        "category": "food",
        "description": "Gochujang soy marinade, sushi rice, tobiko, miso mayo, avocado and more"
      },
      {
        "name": "Pesto Linguine",
        "price": "$21",
        "category": "food",
        "description": "Choice of sautéed chicken or prawns"
      },
      {
        "name": "Caper Dill Salmon",
        "price": "$26",
        "category": "food",
        "description": "Oven-roasted steelhead, caper dill aioli, crispy potatoes, seasonal vegetables"
      },
      {
        "name": "7oz Sirloin Steak Frites",
        "price": "$29",
        "category": "food",
        "description": "Peppercorn sauce, fries, truffle arugula"
      },
      {
        "name": "Well Highballs",
        "price": "$5",
        "category": "drink",
        "description": "1oz $5 | 2oz $8"
      },
      {
        "name": "LOLO Tequila Paloma Fizz",
        "price": "$7",
        "category": "drink",
        "description": "1oz"
      },
      {
        "name": "Pink Lemonade Slush",
        "price": "$8",
        "category": "drink",
        "description": "2oz; or add a side to any drink $2"
      },
      {
        "name": "Cherry Blaster",
        "price": "$10",
        "category": "drink",
        "description": "2oz cocktail"
      },
      {
        "name": "Classic Margarita",
        "price": "$10",
        "category": "drink",
        "description": "2oz cocktail"
      },
      {
        "name": "Aperol Spritz",
        "price": "$11",
        "category": "drink",
        "description": "2oz spirit + 3oz wine"
      },
      {
        "name": "Red Sangria",
        "price": "$9",
        "category": "drink",
        "description": "1oz spirit + 3oz wine"
      },
      {
        "name": "Rosé Sangria",
        "price": "$10",
        "category": "drink",
        "description": "1oz spirit + 4oz wine"
      },
      {
        "name": "Phillips Tilt Lager",
        "price": "$5",
        "category": "drink",
        "description": "16oz $5 | 20oz $6.50"
      },
      {
        "name": "Red Truck La Strada Pilsner",
        "price": "$5",
        "category": "drink",
        "description": "16oz $5 | 20oz $6.50"
      },
      {
        "name": "Phillips Blue Buck Ale",
        "price": "$5.50",
        "category": "drink",
        "description": "16oz $5.50 | 20oz $7"
      },
      {
        "name": "BREWHALL Hall Pass IPA",
        "price": "$6.25",
        "category": "drink",
        "description": "16oz $6.25 | 20oz $7.75"
      },
      {
        "name": "Stone Road White or Red",
        "price": "$6",
        "category": "drink",
        "description": "6oz $6 | 9oz $9"
      },
      {
        "name": "Château Pesquié 1912 Blanc or Rouge",
        "price": "$8.50",
        "category": "drink",
        "description": "6oz $8.50 | 9oz $12.75"
      },
      {
        "name": "JoieFarm A Noble Blend",
        "price": "$11.50",
        "category": "drink",
        "description": "6oz $11.50 | 9oz $17.25"
      },
      {
        "name": "Modest Wines Rosé",
        "price": "$10",
        "category": "drink",
        "description": "6oz $10 | 9oz $15"
      },
      {
        "name": "Poplar Grove Generation Merlot",
        "price": "$13",
        "category": "drink",
        "description": "6oz $13 | 9oz $19.25"
      },
      {
        "name": "Sour Cherry Lemonade",
        "price": "$4.50",
        "category": "drink",
        "description": "Non-alcoholic"
      },
      {
        "name": "Corona Cero",
        "price": "$6",
        "category": "drink",
        "description": "Non-alcoholic"
      },
      {
        "name": "Non-Alc Mionetto Spritz",
        "price": "$10.50",
        "category": "drink",
        "description": "Non-alcoholic"
      },
      {
        "name": "Bottles of Wine",
        "price": "50% off",
        "category": "drink",
        "description": "Happy hour 50% off bottles: Quinta da Lixa Vinho Verde $22, Stoneleigh Sauvignon Blanc $27, Claude Val Rosé $26, Campo Viejo Reserva Red $27, Take It To The Grave Shiraz $30 (prices reflect the discount)"
      }
    ],
    "source_url": "https://tapandbarrel.com/wp-content/uploads/2026/04/Convention-Centre-Food-Menu.pdf",
    "extracted_at": "2026-08-30"
  },
  "p2b-restaurant-bar": {
    "deals": [
      {
        "name": "Highballs",
        "price": "$6",
        "category": "drink",
        "description": "1oz"
      },
      {
        "name": "House Draft Beer",
        "price": "$6",
        "category": "drink",
        "description": "14oz"
      },
      {
        "name": "House Negroni",
        "price": "$9",
        "category": "drink",
        "description": "2.5oz"
      },
      {
        "name": "House Red or White Wine",
        "price": "$7",
        "category": "drink",
        "description": "5oz"
      },
      {
        "name": "Espresso Martini",
        "price": "$12",
        "category": "drink",
        "description": "2oz"
      },
      {
        "name": "Sea Salt Fries & Dip",
        "price": "$6",
        "category": "food",
        "description": "crispy golden fries, chipotle aioli"
      },
      {
        "name": "House-Made Chips & Dip",
        "price": "$6",
        "category": "food",
        "description": "crispy potato chips, chipotle aioli"
      },
      {
        "name": "Hummus Dip + Flat Bread",
        "price": "$9",
        "category": "food",
        "description": "creamy hummus, grilled flatbread, cherry tomatoes, olives, lemon yogurt"
      },
      {
        "name": "Sourdough & Olive Oil",
        "price": "$9",
        "category": "food",
        "description": "extra virgin olive oil, balsamic vinegar, olive tapenade, garlic butter; vegetarian"
      },
      {
        "name": "Gyozas & Greens",
        "price": "$10",
        "category": "food",
        "description": "pan-seared pork dumplings, ponzu sauce"
      },
      {
        "name": "Pulled Pork Sliders Duo",
        "price": "$11",
        "category": "food",
        "description": "house smoked pulled pork, coleslaw, brioche buns"
      },
      {
        "name": "Wings & Fried Pickle Chips",
        "price": "$13",
        "category": "food",
        "description": "chicken wings, fried pickle chips, ranch dip, tzatziki"
      },
      {
        "name": "Charcuterie Board",
        "price": "$18",
        "category": "food",
        "description": "prosciutto, salami, brie, blue cheese, cheddar, pickles, olives, apricot jam, grilled sourdough"
      },
      {
        "name": "Chips & Guacamole",
        "price": "$10",
        "category": "food",
        "description": "corn tortilla chips, house-made guacamole; gluten smart, vegetarian"
      }
    ],
    "source_url": "https://www.p2bbistro.com/happyhour",
    "extracted_at": "2026-08-30"
  },
  "1931-gallery-bistro": {
    "deals": [
      {
        "name": "Provence Highball",
        "price": "$10",
        "category": "drink",
        "description": "vodka, fresh cucumber syrup, hibiscus, lime, soda"
      },
      {
        "name": "Afternoon Fizz",
        "price": "$10",
        "category": "drink",
        "description": "gin, house-made blueberry lavender syrup, lemon"
      },
      {
        "name": "Margarita Picante",
        "price": "$11",
        "category": "drink",
        "description": "jalapeño-infused blanco tequila, cointreau noir, lime, agave"
      },
      {
        "name": "Oaxacan Negroni",
        "price": "$11",
        "category": "drink",
        "description": "400 conejos mezcal, campari, lionello rosso vermouth"
      },
      {
        "name": "Aperol Spritz",
        "price": "$12",
        "category": "drink",
        "description": "aperol barbieri, angostura, soda, bubbles, orange"
      },
      {
        "name": "Here's Looking At You, Kid",
        "price": "$14",
        "category": "drink",
        "description": "forty creek whiskey, house chai blend, demerara syrup, peychaud's bitters"
      },
      {
        "name": "Granville Island Lager",
        "price": "$6.5",
        "category": "drink",
        "description": "16oz draft, 5.0%; pitcher $25"
      },
      {
        "name": "Hoyne Among Giants IPA",
        "price": "$7",
        "category": "drink",
        "description": "16oz draft, 6.7%; pitcher $26"
      },
      {
        "name": "Wildeye Ramble On Pale Ale",
        "price": "$7",
        "category": "drink",
        "description": "16oz draft, 4.5%; pitcher $26"
      },
      {
        "name": "Granville Island Rotating Tap",
        "price": "$7.5",
        "category": "drink",
        "description": "16oz draft; pitcher $28"
      },
      {
        "name": "House White / House Red",
        "price": "$7",
        "category": "drink",
        "description": "5oz pour; 8oz $11"
      },
      {
        "name": "Freixenet Cordón Negro Cava",
        "price": "$9",
        "category": "drink",
        "description": "5oz pour; 8oz $14"
      },
      {
        "name": "Pasqua Prosecco",
        "price": "$10",
        "category": "drink",
        "description": "5oz pour; 8oz $16"
      },
      {
        "name": "Freixenet Rosé Prosecco",
        "price": "$12",
        "category": "drink",
        "description": "5oz pour; 8oz $19"
      },
      {
        "name": "Taittinger Brut Champagne",
        "price": "$28",
        "category": "drink",
        "description": "5oz pour; 8oz $44"
      },
      {
        "name": "Wakefield Riesling",
        "price": "$9",
        "category": "drink",
        "description": "5oz pour; 8oz $14"
      },
      {
        "name": "Roche Chardonnay",
        "price": "$13",
        "category": "drink",
        "description": "5oz pour; 8oz $20"
      },
      {
        "name": "Carmen DO Semillón",
        "price": "$18",
        "category": "drink",
        "description": "5oz pour; 8oz $28"
      },
      {
        "name": "Brocard 'Sainte Claire' Chablis",
        "price": "$19",
        "category": "drink",
        "description": "5oz pour; 8oz $30"
      },
      {
        "name": "Checkmate 'Fool's Mate' Chardonnay",
        "price": "$37",
        "category": "drink",
        "description": "5oz pour; 8oz $59"
      },
      {
        "name": "Bartier Bros. Pristine Rosé",
        "price": "$8",
        "category": "drink",
        "description": "5oz pour; 8oz $12"
      },
      {
        "name": "Rust Co. Rosé",
        "price": "$12",
        "category": "drink",
        "description": "5oz pour; 8oz $19"
      },
      {
        "name": "1 Mill Road Rosé",
        "price": "$15",
        "category": "drink",
        "description": "5oz pour; 8oz $24"
      },
      {
        "name": "CedarCreek Estate Pinot Noir",
        "price": "$13",
        "category": "drink",
        "description": "5oz pour; 8oz $19"
      },
      {
        "name": "Borgogno 'No Name' Nebbiolo",
        "price": "$22",
        "category": "drink",
        "description": "5oz pour; 8oz $35"
      },
      {
        "name": "Altesino Brunello",
        "price": "$25",
        "category": "drink",
        "description": "5oz pour; 8oz $39"
      },
      {
        "name": "Bottles of wine",
        "price": "20% off",
        "category": "drink",
        "description": "20% off all bottles of wine during happy hour"
      },
      {
        "name": "Marinated Olives",
        "price": "$9",
        "category": "food",
        "description": "castelvetrano, cerignola, kalamata, lemon & parsley marinade, EVOO"
      },
      {
        "name": "Crudité",
        "price": "$11",
        "category": "food",
        "description": "beetroot hummus, seasonal vegetables, pumpkin seeds, kalamata olives, crackers"
      },
      {
        "name": "Beef Slider Duo",
        "price": "$12",
        "category": "food",
        "description": "2oz CAB beef patty, caramelized onion, cheddar cheese, butter lettuce"
      },
      {
        "name": "Burrata & Prosciutto Crostini",
        "price": "$14",
        "category": "food",
        "description": "burrata, sundried tomato pesto, arugula, sourdough bread"
      },
      {
        "name": "Crab Dip",
        "price": "$14",
        "category": "food",
        "description": "artichoke hearts, old bay, parmesan cheese, forno bread"
      },
      {
        "name": "Mini Prawn & Lobster Roll",
        "price": "$15",
        "category": "food",
        "description": "brioche bun, shredded lettuce, old bay aioli, avocado puree, micro greens"
      },
      {
        "name": "Vegetable Flatbread",
        "price": "$16",
        "category": "food",
        "description": "foraged mushrooms, caramelized onions, bechamel sauce, ricotta, arugula, truffle oil"
      },
      {
        "name": "Wagyu Beef Carpaccio",
        "price": "$17",
        "category": "food",
        "description": "wagyu eye of round, horseradish aioli, arugula, crispy onions, parmesan, sourdough bread"
      },
      {
        "name": "Salmon Flatbread",
        "price": "$17",
        "category": "food",
        "description": "smoked salmon, dill cream cheese, arugula, capers, pickled shallots"
      },
      {
        "name": "Octopus",
        "price": "$21",
        "category": "food",
        "description": "paprika marinated octopus, fingerling potatoes, romesco sauce, kalamata olives, radishes"
      },
      {
        "name": "Charcuterie Board",
        "price": "$27",
        "category": "food",
        "description": "cured meats and cheeses, olives, house made jam & crackers; cheese only or meat only $15"
      }
    ],
    "source_url": "https://www.1931gallerybistro.com/s/Summer-Beverage-2026-2.pdf",
    "extracted_at": "2026-08-30"
  },
  "hawksworth-restaurant": {
    "deals": [
      {
        "name": "Freshly shucked oysters",
        "price": "$2 ea",
        "category": "food",
        "description": "mignonette, cocktail sauce"
      },
      {
        "name": "Housemade focaccia",
        "price": "$7",
        "category": "food",
        "description": "sun-dried tomato, olive, parmesan"
      },
      {
        "name": "Marinated frescatrano olives",
        "price": "$7",
        "category": "food",
        "description": "crushed chili, garlic, shallot"
      },
      {
        "name": "'KFC'",
        "price": "$10",
        "category": "food",
        "description": "korean fried cauliflower, sesame"
      },
      {
        "name": "Ceviche of the day",
        "price": "$12",
        "category": "food",
        "description": "lime, ginger, chiles"
      },
      {
        "name": "Truffle fries",
        "price": "$12",
        "category": "food",
        "description": "parmesan, chives"
      },
      {
        "name": "Three cheese platter",
        "price": "$15",
        "category": "food",
        "description": "candied fig, pear compote, marcona almond"
      },
      {
        "name": "Steak tartare",
        "price": "$16",
        "category": "food",
        "description": "mustard, cornichon, cured yolk, potato chip"
      },
      {
        "name": "Prawn cocktail",
        "price": "$16",
        "category": "food",
        "description": "horseradish, cocktail sauce, avocado"
      },
      {
        "name": "Shrimp & pork wontons",
        "price": "$16",
        "category": "food",
        "description": "chili oil, peanut, cilantro"
      },
      {
        "name": "BBQ pork ribs",
        "price": "$18",
        "category": "food",
        "description": "five spice bbq sauce, nuts, cilantro, chili"
      },
      {
        "name": "Sasanian siberian caviar",
        "price": "$75",
        "category": "food",
        "description": "potato chips, creme fraiche"
      },
      {
        "name": "B&B",
        "price": "$31",
        "category": "food",
        "description": "hawksworth classic burger, crispy bacon, onion ring, old cheddar, fries with a choice of hawksworth 'georgia' lager or 'hazy hawk' ipa"
      },
      {
        "name": "Daiquiri",
        "price": "$10",
        "category": "drink",
        "description": "havana club 3yr, lime juice, simple syrup, 2oz"
      },
      {
        "name": "Martini",
        "price": "$10",
        "category": "drink",
        "description": "absolut vodka or tanqueray gin, 2oz"
      },
      {
        "name": "Hotel Georgia",
        "price": "$10",
        "category": "drink",
        "description": "tanqueray gin, orgeat, lemon, orange blossom water, egg white, 2oz"
      },
      {
        "name": "Moscow mule",
        "price": "$10",
        "category": "drink",
        "description": "absolut vodka, ginger beer, fresh lime juice, 2oz"
      },
      {
        "name": "Negroni",
        "price": "$11",
        "category": "drink",
        "description": "tanqueray, cinzano rosso, campari, 2.5oz"
      },
      {
        "name": "Paloma",
        "price": "$11",
        "category": "drink",
        "description": "altos tequila plata, lime, grapefruit juice, club soda, 2oz"
      },
      {
        "name": "Hawksworth 'Georgia' lager",
        "price": "$7",
        "category": "drink",
        "description": "north point brewing co., 355ml"
      },
      {
        "name": "Hawksworth 'Hazy Hawk' IPA",
        "price": "$7",
        "category": "drink",
        "description": "north point brewing co., 355ml"
      },
      {
        "name": "Wine by the glass",
        "price": "$10",
        "category": "drink",
        "description": "cape wine company chenin blanc or sandhill cabernet/merlot, 5oz (bottle $50)"
      },
      {
        "name": "Thai lemonade",
        "price": "$7",
        "category": "drink",
        "description": "zero proof: fresh lime, cilantro, orgeat, ginger beer"
      },
      {
        "name": "Strawberry spritz",
        "price": "$7",
        "category": "drink",
        "description": "zero proof: cardamom, lemon, soda water"
      },
      {
        "name": "Asahi 'Super Dry' 0.0%",
        "price": "$6",
        "category": "drink",
        "description": "zero proof lager, 330ml"
      },
      {
        "name": "Nova zero proof sparkling rose",
        "price": "$10",
        "category": "drink",
        "description": "zero proof sparkling rose"
      }
    ],
    "source_url": "https://hawksworthrestaurant.com/wp-content/uploads/2026/08/Features.Aug_.26.26.pdf",
    "extracted_at": "2026-08-30"
  },
  "banter-room": {
    "deals": [
      {
        "name": "Banter Lager",
        "price": "$6",
        "category": "drink",
        "description": "House lager"
      },
      {
        "name": "Russell Pale Ale",
        "price": "$6",
        "category": "drink",
        "description": "Pale ale"
      },
      {
        "name": "Muddlers Moscow Mule",
        "price": "$7",
        "category": "drink",
        "description": "Canned Moscow mule"
      },
      {
        "name": "NUDE Raspberry Lemon",
        "price": "$7",
        "category": "drink",
        "description": "Canned vodka soda, raspberry lemon"
      },
      {
        "name": "White Claw Black Cherry",
        "price": "$8",
        "category": "drink",
        "description": "Hard seltzer, black cherry"
      },
      {
        "name": "House Red, White & Rosé",
        "price": "$9",
        "category": "drink",
        "description": "6oz glass"
      },
      {
        "name": "Tequila Soda & Slush",
        "price": "$11",
        "category": "drink",
        "description": ""
      },
      {
        "name": "Espresso Martini",
        "price": "$12",
        "category": "drink",
        "description": "Ketel One Vodka, Kahlua, cold brew coffee, simple syrup"
      },
      {
        "name": "Who Is She?",
        "price": "$12",
        "category": "drink",
        "description": "Smirnoff Vanilla Vodka, Passoã Passion Fruit Liqueur, Fiol Prosecco, passion fruit syrup, lime, simple syrup"
      },
      {
        "name": "First Crush",
        "price": "$12",
        "category": "drink",
        "description": "Ketel One Vodka, Peach Schnapps, rhubarb, lemon, black tea"
      },
      {
        "name": "Tacos",
        "price": "$7",
        "category": "food",
        "description": "Served as singles, choice of chicken, prawn or carne asada"
      },
      {
        "name": "Smash Buddy",
        "price": "$8",
        "category": "food",
        "description": "Ground chuck patty slider"
      },
      {
        "name": "Salmon Oshi",
        "price": "$9",
        "category": "food",
        "description": "4pc pressed BC steelhead sushi"
      },
      {
        "name": "Roasted Beet Hummus",
        "price": "$14",
        "category": "food",
        "description": "Tzatziki, tabouli, crispy chickpeas, grilled pita, feta cheese"
      },
      {
        "name": "Avocado Bruschetta",
        "price": "$14",
        "category": "food",
        "description": "Cherry tomatoes, parmesan, avocado, basil pesto, balsamic reduction, focaccia"
      },
      {
        "name": "Crispy Tiger Prawns",
        "price": "$14",
        "category": "food",
        "description": "White tiger prawns, coleslaw, cilantro, sweet chili aioli"
      },
      {
        "name": "Beef Carpaccio",
        "price": "$15",
        "category": "food",
        "description": "Seared eye of round, truffle aioli, arugula, fried capers, pickled onions, parmesan, lemon, crostini"
      }
    ],
    "source_url": "https://www.banterroom.com/menu",
    "extracted_at": "2026-08-30"
  },
  "the-greek-by-anatoli-yaletown": {
    "deals": [
      {
        "name": "Hummus",
        "price": "$11",
        "category": "food",
        "description": "Chickpeas, tahini, garlic, lemon, parsley, pita (vegan)"
      },
      {
        "name": "Dip Taster",
        "price": "$13",
        "category": "food",
        "description": "Hummus, tzatziki, tirosalata, pita"
      },
      {
        "name": "Greek Salad",
        "price": "$15",
        "category": "food",
        "description": "Tomato, cucumber, onion, peppers, olives, capers, feta; sub vegan coconut feta +$1 (GF)"
      },
      {
        "name": "Keftedes",
        "price": "$8",
        "category": "food",
        "description": "Two lamb & beef meatballs, tomato sauce, saganaki (GF)"
      },
      {
        "name": "Spanakopita",
        "price": "$9",
        "category": "food",
        "description": "Spinach, feta, dill, mint, filo, tzatziki"
      },
      {
        "name": "Spanakorizo",
        "price": "$12",
        "category": "food",
        "description": "Spinach, rice, caramelized onion, dill, olive oil (vegan)"
      },
      {
        "name": "Calamari",
        "price": "$13",
        "category": "food",
        "description": "Crispy squid, tzatziki"
      },
      {
        "name": "Gyro Merida",
        "price": "$15",
        "category": "food",
        "description": "Spicy chicken, lettuce, tomato, onion, tzatziki, grilled pita"
      },
      {
        "name": "Grilled Souvlaki",
        "price": "$15",
        "category": "food",
        "description": "Your choice of chicken or prawn skewers, pita, tzatziki"
      },
      {
        "name": "Garlic Prawns",
        "price": "$23",
        "category": "food",
        "description": "Four Argentinian prawns, garlic, white wine, lemon, chili flakes"
      },
      {
        "name": "Mezze Platter",
        "price": "$50",
        "category": "food",
        "description": "Hummus, spanakopita, keftedes, calamari, tzatziki, two grilled chicken souvlaki skewers, pita & Greek salad"
      },
      {
        "name": "Ouzo Shot",
        "price": "$4.5",
        "category": "drink",
        "description": "1 oz"
      },
      {
        "name": "Well Highballs",
        "price": "$5",
        "category": "drink",
        "description": "1 oz; your choice of well spirit and soda"
      },
      {
        "name": "Jameson Shot",
        "price": "$6",
        "category": "drink",
        "description": "1 oz"
      },
      {
        "name": "Parallel 49 House Lager",
        "price": "$7",
        "category": "drink",
        "description": "20 oz draft"
      },
      {
        "name": "Parallel 49 House Pale Ale",
        "price": "$7",
        "category": "drink",
        "description": "20 oz draft"
      },
      {
        "name": "Parallel 49 Trash Panda",
        "price": "$9.5",
        "category": "drink",
        "description": "20 oz hazy IPA draft"
      },
      {
        "name": "Helen's Sangria",
        "price": "$8",
        "category": "drink",
        "description": "5 oz; Makris family recipe"
      },
      {
        "name": "Aperol Spritz",
        "price": "$12",
        "category": "drink",
        "description": "5 oz; Aperol, bubbles, soda, orange"
      },
      {
        "name": "Anatoli Caesar",
        "price": "$12",
        "category": "drink",
        "description": "2 oz; Northern Keep vodka, clamato, Worcestershire, crispy fried prawn"
      },
      {
        "name": "Helios Daiquiri",
        "price": "$10",
        "category": "drink",
        "description": "2 oz; Bacardi white rum, mango, ginger, lime"
      },
      {
        "name": "Glass of House Wine",
        "price": "$9",
        "category": "drink",
        "description": "5 oz; Anatoli Viognier, Stone Road Rosé, or Anatoli Meritage"
      },
      {
        "name": "Bottles of Wine",
        "price": "$10 off",
        "category": "drink",
        "description": "All bottles of wine $10 off"
      },
      {
        "name": "Zero Spritz",
        "price": "$11",
        "category": "drink",
        "description": "Non-alcoholic; Noa orange liqueur, Noa Italian aperitif, non-alc bubbles, soda"
      },
      {
        "name": "Corona Cero",
        "price": "$6",
        "category": "drink",
        "description": "0.0 non-alcoholic beer"
      }
    ],
    "source_url": "https://www.thegreekbyanatoli.com/yaletown-menu",
    "extracted_at": "2026-08-30"
  },
  "the-parlour": {
    "deals": [
      {
        "name": "Patron Shot",
        "price": "$12",
        "category": "drink",
        "description": "Silver or Reposado"
      },
      {
        "name": "House Margarita",
        "price": "$12",
        "category": "drink",
        "description": "2 oz"
      },
      {
        "name": "House Wine",
        "price": "$1.75/oz",
        "category": "drink",
        "description": "Red, White or Rosé"
      },
      {
        "name": "Stella Artois",
        "price": "$8",
        "category": "drink",
        "description": "16 oz"
      },
      {
        "name": "Tippy Canoe Lager",
        "price": "$6.75",
        "category": "drink",
        "description": "By Granville Island, 16 oz"
      },
      {
        "name": "Highballs",
        "price": "$7.75",
        "category": "drink",
        "description": "Highballs"
      },
      {
        "name": "Luc Belaire Sparkling Rose",
        "price": "$69",
        "category": "drink",
        "description": "750 ml bottle"
      },
      {
        "name": "Don Julio 1942 Tequila Shots",
        "price": "$22",
        "category": "drink",
        "description": "Don Julio 1942 tequila shots"
      },
      {
        "name": "Premium Oysters",
        "price": "$3 ea",
        "category": "food",
        "description": "Monday - Thursday, all day"
      },
      {
        "name": "Meatball Mini",
        "price": "$6 ea",
        "category": "food",
        "description": "Meatball mini"
      },
      {
        "name": "Lobster Roll",
        "price": "$7 ea",
        "category": "food",
        "description": "Mini lobster roll"
      },
      {
        "name": "Boeuf Dip Slider",
        "price": "$7 ea",
        "category": "food",
        "description": "Braised beef short rib slider"
      },
      {
        "name": "Belly Bite",
        "price": "$6/bite",
        "category": "food",
        "description": "Crispy pork belly bite, gluten free"
      },
      {
        "name": "Roasted Veg",
        "price": "$12",
        "category": "food",
        "description": "Gluten free"
      },
      {
        "name": "Brocco",
        "price": "$12",
        "category": "food",
        "description": "Broccoli dish, gluten free, can be made vegan"
      },
      {
        "name": "Caesar Salad",
        "price": "$12",
        "category": "food",
        "description": "Caesar salad"
      }
    ],
    "source_url": "https://theparlourrestaurants.com/vancouver-menu/",
    "extracted_at": "2026-08-30"
  },
  "alchemy-bar-kitchen": {
    "deals": [
      {
        "name": "Beef Carpaccio",
        "price": "$16.95",
        "category": "food",
        "description": "Beef tenderloin, arugula, shaved Grana Padano, capers, EVOO, lemon juice, served with Alchemy bread."
      },
      {
        "name": "Cheesy Spinach & Artichoke Dip",
        "price": "$15.95",
        "category": "food",
        "description": "A blend of spinach, artichokes, and cheese, served with tortilla chips."
      },
      {
        "name": "Chicken Wings",
        "price": "$16.95",
        "category": "food",
        "description": "House-made marinated wings: Hot, S&P, Lemon Pepper, Honey Garlic, or BBQ."
      },
      {
        "name": "Prawn & Parmesan Arancini",
        "price": "$17.95",
        "category": "food",
        "description": "3 golden crispy risotto balls stuffed with mozzarella, topped with garlic lemon prawns."
      },
      {
        "name": "Calamari Salad",
        "price": "$15.95",
        "category": "food",
        "description": "House-mixed greens, crispy calamari, feta cheese, sliced tomatoes, pickled radish."
      },
      {
        "name": "Chicken Pesto",
        "price": "$21.95",
        "category": "food",
        "description": "Linguine tossed in house pesto with chicken, sun-dried tomatoes, Grana Padano, and pine nuts."
      },
      {
        "name": "Spaghetti Meatball",
        "price": "$21.95",
        "category": "food",
        "description": "House-made 100% beef meatballs, tomato sauce, Grana Padano, and parsley."
      },
      {
        "name": "Alchemy Loaded Mushroom Burger",
        "price": "$21.95",
        "category": "food",
        "description": "Beef patty, sautéed truffled mushrooms, cheddar, caramelized onions, house truffle mayo, served with fries."
      },
      {
        "name": "Margherita Pizza",
        "price": "$19.95",
        "category": "food",
        "description": "Tomato sauce, mozzarella, cherry tomato, bocconcini, herbs, Grana Padano. Regular menu Margherita Classico is $23.95."
      },
      {
        "name": "Crème Brûlée",
        "price": "$6.95",
        "category": "food",
        "description": "Rich vanilla custard, caramelized sugar crust."
      },
      {
        "name": "Classic Margarita",
        "price": "$10",
        "category": "drink",
        "description": "Happy hour cocktail price."
      },
      {
        "name": "Espresso Martini",
        "price": "$13",
        "category": "drink",
        "description": "Happy hour cocktail price."
      },
      {
        "name": "Aperol Spritz",
        "price": "$11",
        "category": "drink",
        "description": "Happy hour cocktail price."
      },
      {
        "name": "Moscow Mule",
        "price": "$13",
        "category": "drink",
        "description": "Happy hour cocktail price."
      },
      {
        "name": "Old Fashioned",
        "price": "$14",
        "category": "drink",
        "description": "Happy hour cocktail price."
      },
      {
        "name": "Rotating Tap Beer",
        "price": "$6.5",
        "category": "drink",
        "description": "Rotating draught selection."
      },
      {
        "name": "Pinot Grigio",
        "price": "$8",
        "category": "drink",
        "description": "5oz $8, 8oz $11, bottle $35."
      },
      {
        "name": "Malbec",
        "price": "$8",
        "category": "drink",
        "description": "5oz $8, 8oz $11, bottle $35."
      }
    ],
    "source_url": "https://www.alchemybar-kitchen.ca/happyhour.html",
    "extracted_at": "2026-08-30"
  }
};

const VENUES_DISCOVERED = [
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-cambie-bar-grill",
    "name": "The Cambie Bar & Grill",
    "formatted_address": "300 Cambie St., Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2831142,
        "lng": -123.109
      }
    },
    "formatted_phone_number": "(604) 688-9158",
    "website": "http://www.cambiepubs.com/",
    "happy_hour": {
      "days": [
        0,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "21:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://cambiepubs.com/menu/daily-specials-happy-hour",
      "deals": [
        {
          "name": "Burger + Brew",
          "price": "$10",
          "category": "food",
          "description": "P49 Craft Lager (12oz beer) + Happy Burger; add fries $3"
        },
        {
          "name": "Happy Burger",
          "price": "$8",
          "category": "food",
          "description": "Beef patty, lettuce, pickles, tomato, red onion, burger sauce; add fries $3"
        },
        {
          "name": "12\" Cheese Pizza",
          "price": "$12",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "12\" Pepperoni Pizza",
          "price": "$14",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Asian Noodle Salad",
          "price": "$16",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Cambie Fries",
          "price": "$5",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Cambie Hot Dog",
          "price": "$6",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Chicharrón",
          "price": "$8",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Chicken Chow Mein",
          "price": "$13",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Chicken Tenders & Fries",
          "price": "$13",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Classic Poutine",
          "price": "$8",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Dirty Fries",
          "price": "$9",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Fish & Chips",
          "price": "$13",
          "category": "food",
          "description": "1 piece; add a 2nd piece $4"
        },
        {
          "name": "Pretzel Bites",
          "price": "$7",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "Yam Fries",
          "price": "$8",
          "category": "food",
          "description": "Happy hour menu price"
        },
        {
          "name": "P49 Craft Lager",
          "price": "$3.50",
          "category": "drink",
          "description": "12 oz, tax included"
        },
        {
          "name": "Draft",
          "price": "$4.75",
          "category": "drink",
          "description": "16 oz $4.75 / 54 oz $17.00 — Driftwood Fat Tug IPA, Miller Lite, Parkside Motel Hazy Pale Ale, Phillips Pilsner, Granville Island English Bay Ale, Granville Island Hazy Guava Pale Ale, La Cerveceria Salted Lime Lager"
        },
        {
          "name": "Beer + Shot Combo",
          "price": "$9",
          "category": "drink",
          "description": "Molson Canadian, Pabst Blue Ribbon, Phillips Blue Buck or Granville Island Lager (Canucks Edition) + Jameson, Fireball, El Tequileño Tequila or Jägermeister"
        },
        {
          "name": "Wine",
          "price": "$5",
          "category": "drink",
          "description": "6 oz $5 / 9 oz $7 — white, red or rosé"
        },
        {
          "name": "Sangria",
          "price": "$7",
          "category": "drink",
          "description": "6 oz glass $7 / 54 oz pitcher $21"
        },
        {
          "name": "Margarita Slush",
          "price": "$13",
          "category": "drink",
          "description": "2 oz; classic lime or strawberry"
        },
        {
          "name": "Rum Punch",
          "price": "$11",
          "category": "drink",
          "description": "2 oz"
        },
        {
          "name": "Olé",
          "price": "$6",
          "category": "drink",
          "description": "Paloma or Margarita"
        },
        {
          "name": "Whiteclaw",
          "price": "$6",
          "category": "drink",
          "description": "Lime, Tangerine, Black Cherry, Lemon or Blackberry"
        },
        {
          "name": "Verve Dry Apple Cider",
          "price": "$5",
          "category": "drink",
          "description": "16 oz"
        },
        {
          "name": "Sol Buckets",
          "price": "$25",
          "category": "drink",
          "description": "5 x 330 ml"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "cactus-club-cafe",
    "name": "Cactus Club Cafe",
    "formatted_address": "588 Burrard St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.285465099999996,
        "lng": -123.11871850000001
      }
    },
    "formatted_phone_number": "(778) 860-7288",
    "website": "https://www.cactusclubcafe.com/locations/bentall-5/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.cactusclubcafe.com/locations/bentall-5/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "marcello-ristorante-pizzeria",
    "name": "Marcello Ristorante & Pizzeria",
    "formatted_address": "1404 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.272041699999996,
        "lng": -123.0694139
      }
    },
    "formatted_phone_number": "(604) 215-7760",
    "website": "http://marcellopizzeria.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "11:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://marcellopizzeria.com/wp-content/uploads/2026/03/marcello-happyhour-menu-march2026.pdf",
      "deals": [
        {
          "name": "Signature Cocktails",
          "price": "$11",
          "category": "drink",
          "description": "1.0 oz. Choice of Trentino Spritz, Smokey Spicy Margarita, Coconut Berry Delight, Marcello's Paradise, Red Wine Sangria, or Negroni Rosa"
        },
        {
          "name": "House Wine",
          "price": "$5",
          "category": "drink",
          "description": "Red or white"
        },
        {
          "name": "Beer on Tap",
          "price": "$5",
          "category": "drink",
          "description": "Peroni on tap"
        },
        {
          "name": "0.0% Peroni and Margherita",
          "price": "$19",
          "category": "food",
          "description": "Daily special: 0.0% Peroni non-alcoholic beer paired with a Margherita pizza, 11am to 5pm"
        },
        {
          "name": "Lobster & Crab Ravioli",
          "price": "$24",
          "category": "food",
          "description": "Topped with prawn sauce"
        },
        {
          "name": "Cotoletta Milanese",
          "price": "$27",
          "category": "food",
          "description": "Crispy Italian chicken cutlet"
        },
        {
          "name": "Grilled Octopus",
          "price": "$29",
          "category": "food",
          "description": "Tender, smokey char tentacles"
        },
        {
          "name": "Polpette from Nonna's Recipe",
          "price": "$12",
          "category": "food",
          "description": "3 meatballs in tomato sauce"
        },
        {
          "name": "Frittura di Calamari",
          "price": "$14",
          "category": "food",
          "description": "Deep fried baby squid"
        },
        {
          "name": "Coconut Prawns",
          "price": "$12",
          "category": "food",
          "description": "5 breaded fried prawns with sweet spicy sauce"
        },
        {
          "name": "Gelati",
          "price": "$6",
          "category": "food",
          "description": "Italian gelato"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "mangos-kitchen-bar",
    "name": "Mangos Kitchen Bar",
    "formatted_address": "1180 Howe St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2782409,
        "lng": -123.1260775
      }
    },
    "formatted_phone_number": "(604) 559-5533",
    "website": "https://www.mangosvancouver.com/",
    "happy_hour": {
      "days": [
        2,
        3,
        4,
        5
      ],
      "start": "15:00",
      "end": "19:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.mangosvancouver.com/menu/happy-hour-and-daily-specials",
      "deals": [
        {
          "name": "House Lager",
          "price": "$4.95",
          "category": "drink",
          "description": "Old Fashion Pilsner on tap, 12 oz"
        },
        {
          "name": "Beer bottle",
          "price": "$6.95",
          "category": "drink",
          "description": "Sol, Bud & Canadian"
        },
        {
          "name": "Highball",
          "price": "$5.95",
          "category": "drink",
          "description": "Mix any of our house highballs or take a shot"
        },
        {
          "name": "Wine",
          "price": "$5.95/$8.95",
          "category": "drink",
          "description": "Red or white, 6 oz / 9 oz"
        },
        {
          "name": "Margarita Clasica",
          "price": "$9.95",
          "category": "drink",
          "description": "Lime margarita"
        },
        {
          "name": "Maracuya Margarita",
          "price": "$10.95",
          "category": "drink",
          "description": "Passionfruit margarita"
        },
        {
          "name": "Piña Colada",
          "price": "$10.95",
          "category": "drink",
          "description": "Bacardi rum, pineapple coconut mix"
        },
        {
          "name": "La Patrona",
          "price": "$12.95",
          "category": "drink",
          "description": "Patron Blanco, blue curacao"
        },
        {
          "name": "Chips & Guac",
          "price": "$10.95",
          "category": "food",
          "description": "Tortilla chips, fresh guacamole"
        },
        {
          "name": "3 Tacos",
          "price": "$12.95",
          "category": "food",
          "description": "Chicken or carnitas; corn tortilla topped with onion, cilantro, with green salsa and limes. Extra taco $2.99"
        },
        {
          "name": "El Argentino",
          "price": "$13.95",
          "category": "food",
          "description": "Sandwich: pork sausage on a roll with chimichurri, mayo, tomato, lettuce and fries"
        },
        {
          "name": "El Chileno",
          "price": "$13.95",
          "category": "food",
          "description": "Sandwich: grilled sliced steak on Chilean bread with mayo, avocado and fries"
        },
        {
          "name": "El Peruano",
          "price": "$13.95",
          "category": "food",
          "description": "Bolillo with lomo saltado — beef stir-fried with onions, tomatoes, soy sauce blend, with fries"
        },
        {
          "name": "El Mexicano",
          "price": "$13.95",
          "category": "food",
          "description": "Bolillo with milanesa, avocado, mayo, tomato, sweet peppers, shredded lettuce and fries"
        },
        {
          "name": "Chicken Quesadillas",
          "price": "$15.95",
          "category": "food",
          "description": "Flour tortilla, cheese, cilantro chicken topped with pico de gallo and sour cream"
        },
        {
          "name": "Steak Chimichurri",
          "price": "$18.95",
          "category": "food",
          "description": "2 steak skewers with chimichurri and a side of fries with rocoto mayo"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "st-augustine-s",
    "name": "St. Augustine's",
    "formatted_address": "2360 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2637918,
        "lng": -123.06954839999999
      }
    },
    "formatted_phone_number": "(604) 225-9135",
    "website": "http://staugustinesvancouver.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://staugustinesvancouver.com/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "cactus-club-cafe-2",
    "name": "Cactus Club Cafe",
    "formatted_address": "357 Davie St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2750802,
        "lng": -123.12276200000001
      }
    },
    "formatted_phone_number": "(778) 771-4645",
    "website": "https://www.cactusclubcafe.com/locations/yaletown/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.cactusclubcafe.com/locations/yaletown/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "malone-s-taphouse",
    "name": "Malone's Taphouse",
    "formatted_address": "608 W Pender St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2840609,
        "lng": -123.1141799
      }
    },
    "formatted_phone_number": "(604) 684-9977",
    "website": "http://www.malones.bc.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://malones.bc.ca/menu/hoppy-hour-and-highlights",
      "deals": [
        {
          "name": "Fries",
          "price": "$9",
          "category": "food",
          "description": "BBQ chipotle aioli"
        },
        {
          "name": "King Salmon Chowder",
          "price": "$9",
          "category": "food",
          "description": "New England cream style, king salmon, bacon, carrots, onion, potato, celery; small $9 / large $15"
        },
        {
          "name": "Yam Fries",
          "price": "$11",
          "category": "food",
          "description": "Curry aioli"
        },
        {
          "name": "Truffle Fries",
          "price": "$11.50",
          "category": "food",
          "description": "Shoestring fries, white truffle oil, parmigiano reggiano"
        },
        {
          "name": "Key Lime Pie",
          "price": "$12",
          "category": "food",
          "description": "Tangy and creamy key lime filling, Lotus Biscoff cookie crust, meringue"
        },
        {
          "name": "Veggie and Paneer Pakora",
          "price": "$12",
          "category": "food",
          "description": "Paneer cheese, red onion, russet potato, eggplant, sweet and spicy sauce"
        },
        {
          "name": "Pork Tacos",
          "price": "$13",
          "category": "food",
          "description": "3pcs; pork tenderloin, mozzarella, chipotle pineapple salsa, red pepper, yellow onion, corn tortilla"
        },
        {
          "name": "Octopus Tacos",
          "price": "$14",
          "category": "food",
          "description": "3pcs; pico de gallo, pickled onion, avocado, citrus aioli, corn tortilla"
        },
        {
          "name": "Classic Caesar Salad",
          "price": "$16",
          "category": "food",
          "description": "Romaine hearts, croutons, bacon bits, parmigiano reggiano, house made caesar dressing"
        },
        {
          "name": "Malone's Garden Salad",
          "price": "$16",
          "category": "food",
          "description": "Tender greens, heirloom grape tomatoes, carrot, cucumber; choice of balsamic, ranch or blue cheese dressing"
        },
        {
          "name": "Malone's Burger & Fries",
          "price": "$17",
          "category": "food",
          "description": "House made burger, lettuce, burger sauce, tomato, pickles, brioche bun"
        },
        {
          "name": "Rib Eye Beef Dip & Fries",
          "price": "$18",
          "category": "food",
          "description": "Thinly sliced rib eye, horseradish aioli, ciabatta bun, beef au jus"
        },
        {
          "name": "Birria Tacos",
          "price": "$19",
          "category": "food",
          "description": "3pcs; braised short rib, mozzarella, onion, cilantro, pickled carrot, beef consomme, corn tortilla"
        },
        {
          "name": "Short Rib Sando & Fries",
          "price": "$19",
          "category": "food",
          "description": "Short rib, Swiss cheese, mayo, bbq sauce, tender greens, pickle, brioche bun"
        },
        {
          "name": "Sweet & Spicy Chicken Rice Bowl",
          "price": "$20",
          "category": "food",
          "description": "Crispy chicken thigh, sweet & spicy glaze, cured egg yolk, cucumber, green onion, pickled ginger, Kewpie mayo, sesame seeds, medium grain rice"
        },
        {
          "name": "Margherita Pizza",
          "price": "$20",
          "category": "food",
          "description": "San marzano tomato sauce, Fior di Latte mozzarella, heirloom grape tomatoes, fresh basil"
        },
        {
          "name": "Craft Lager",
          "price": "$5",
          "category": "drink",
          "description": "14oz draft; Parallel 49 Brewing, Vancouver, BC"
        },
        {
          "name": "Implosion Pilsner",
          "price": "$5.50",
          "category": "drink",
          "description": "14oz draft; Phillips Brewing, Victoria, BC"
        },
        {
          "name": "Pale Ale",
          "price": "$5.50",
          "category": "drink",
          "description": "14oz draft; Steamworks Brewing, Vancouver, BC"
        },
        {
          "name": "Driftwood Fat Tug",
          "price": "$5.50",
          "category": "drink",
          "description": "14oz draft; Driftwood Brewing"
        },
        {
          "name": "Motel Hazy Pale Ale",
          "price": "$5.50",
          "category": "drink",
          "description": "14oz draft; Parkside Brewing, Port Moody, BC"
        },
        {
          "name": "Spanish Banks Hazy Guava Pale Ale",
          "price": "$5.50",
          "category": "drink",
          "description": "14oz draft; Granville Island Brewing, Vancouver, BC"
        },
        {
          "name": "Brewery Showdown Winner Amber Lager",
          "price": "$6",
          "category": "drink",
          "description": "Patina Brewing Co, Port Coquitlam, BC"
        },
        {
          "name": "Brewery Showdown Flight",
          "price": "$8",
          "category": "drink",
          "description": "4x5oz: Fluffy Cloud Hazy IPA, Peach Raspberry Sour, Beach Lemon Mandarin Radler, Premium Rice Lager"
        },
        {
          "name": "Happy Wine",
          "price": "$6",
          "category": "drink",
          "description": "White, red or rosé; 6oz $6 / 9oz $9"
        },
        {
          "name": "Sangria",
          "price": "$8",
          "category": "drink",
          "description": "6oz $8 / pitcher $22; red wine mix topped with frozen bellini"
        },
        {
          "name": "Malone's Paloma",
          "price": "$11",
          "category": "drink",
          "description": "Gordon's gin, grapefruit juice, simple syrup, topped with bubbles"
        },
        {
          "name": "Frozen Bellini",
          "price": "$12",
          "category": "drink",
          "description": "Captain Morgan white rum, sparkling wine, peach blend topped with red Sangria"
        },
        {
          "name": "White Sangria 0.0",
          "price": "$5.50",
          "category": "drink",
          "description": "Non-alcoholic: Sangre de Toro Blanco 0.0%, peach juice, pineapple juice, lemon, simple syrup"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "la-mezcaleria",
    "name": "La Mezcaleria",
    "formatted_address": "1622 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2701263,
        "lng": -123.0694685
      }
    },
    "formatted_phone_number": "(604) 305-3327",
    "website": "http://www.lamezcaleria.ca/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "16:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.lamezcaleria.ca/happy-hour-lunch",
      "deals": [
        {
          "name": "Palomita",
          "price": "$11",
          "category": "drink",
          "description": "Jose Cuervo Tradicional Reposado / grapefruit juice / lime juice / grapefruit soda (2 oz)"
        },
        {
          "name": "Tequila Margarita",
          "price": "$11",
          "category": "drink",
          "description": "Jose Cuervo Tradicional Blanco / Cointreau / lime juice / agave syrup (2 oz)"
        },
        {
          "name": "Batanga",
          "price": "$11",
          "category": "drink",
          "description": "Tequileno Blanco / lime juice / Coca Cola (2 oz)"
        },
        {
          "name": "Draft Lager",
          "price": "$8",
          "category": "drink",
          "description": "Steamworks Lager"
        },
        {
          "name": "House Shot",
          "price": "$8",
          "category": "drink",
          "description": "Sunburn Tequila / spicy serrano / flavour infusion (1 oz)"
        },
        {
          "name": "Draft Michelada",
          "price": "$8",
          "category": "drink",
          "description": "Lime / spice mix / Clamato / Tajin rim / house cerveza"
        },
        {
          "name": "Glass Red Narrative",
          "price": "$7",
          "category": "drink",
          "description": "Red Narrative by the glass (6 oz)"
        },
        {
          "name": "Glass Pinot Gris Haywire",
          "price": "$7",
          "category": "drink",
          "description": "Pinot Gris Haywire by the glass (6 oz)"
        },
        {
          "name": "Cantarito Pitcher",
          "price": "$120",
          "category": "drink",
          "description": "Grapefruit juice / orange juice / lime juice / grapefruit soda / Jose Cuervo Tradicional Reposado (12 oz)"
        },
        {
          "name": "Amiguitos Flight",
          "price": "$21",
          "category": "food",
          "description": "Guacamole / shrimp cocktail / rajas con suero / pico de gallo (GF, NF, VG)"
        },
        {
          "name": "Queso Fundido",
          "price": "$23",
          "category": "food",
          "description": "Melted cheese mix with caramelized onions / corn tortillas (6). Add-ons: green sauce $5, mushrooms $8, chorizo $8 (GF, NF, VG)"
        },
        {
          "name": "Guacamolito",
          "price": "$12",
          "category": "food",
          "description": "Avocado / pico de gallo / macha sauce / home-made corn chips (GF, NF, VG)"
        },
        {
          "name": "Cocktelito Ixtapa",
          "price": "$13",
          "category": "food",
          "description": "Pacific blue shrimp, basa fish, tomato, onion, cucumber & cilantro / tomato & orange cocktail sauce / avocado / fresh herbs / epazote & garlic oil / home-made corn chips (GF, NF, VG, DF)"
        },
        {
          "name": "Churros",
          "price": "$14",
          "category": "food",
          "description": "(2) home-made churros tossed in cinnamon-sugar / chocolate-strawberry vegan ganache (NF, V, VG, DF)"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "cactus-club-cafe-3",
    "name": "Cactus Club Cafe",
    "formatted_address": "575 W Broadway, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.263408299999995,
        "lng": -123.11724330000001
      }
    },
    "formatted_phone_number": "(778) 909-9964",
    "website": "https://www.cactusclubcafe.com/locations/broadway-ash/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.cactusclubcafe.com/locations/broadway-ash/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "sing-sing-main-st",
    "name": "Sing Sing Main St",
    "formatted_address": "2718 Main St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.260676499999995,
        "lng": -123.10082329999999
      }
    },
    "formatted_phone_number": "(604) 336-9556",
    "website": "https://www.freehouse.co/locations/sing-sing?utm_source=google&utm_medium=organic&utm_campaign=gmb",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.freehouse.co/locations/sing-sing?utm_source=google&utm_medium=organic&utm_campaign=gmb",
      "deals": [
        {
          "name": "Lager cans",
          "price": "$5",
          "category": "drink",
          "description": "Lager cans during weekday happy hour"
        },
        {
          "name": "Wine",
          "price": "$6",
          "category": "drink",
          "description": "Wine during weekday happy hour"
        },
        {
          "name": "House cocktails",
          "price": "$3 off",
          "category": "drink",
          "description": "$3 off house cocktails"
        },
        {
          "name": "Select food",
          "price": "$3 off",
          "category": "food",
          "description": "$3 off select food items"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "jamjar-canteen-commercial-dr",
    "name": "Jamjar Canteen Commercial Dr.",
    "formatted_address": "2290 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.264299699999995,
        "lng": -123.0695033
      }
    },
    "formatted_phone_number": "(604) 252-3957",
    "website": "http://www.jamjarcanteen.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:30",
      "end": "17:30",
      "verified": false,
      "verified_source": null,
      "source_url": "http://www.jamjarcanteen.ca/",
      "deals": [
        {
          "name": "Beer",
          "price": "$6",
          "category": "drink",
          "description": "All beers on tap"
        },
        {
          "name": "Red Wine",
          "price": "$7",
          "category": "drink",
          "description": "Happy hour red wine"
        },
        {
          "name": "White Wine",
          "price": "$7",
          "category": "drink",
          "description": "Happy hour white wine"
        },
        {
          "name": "Feature Cocktail",
          "price": "$10",
          "category": "drink",
          "description": "Happy hour feature cocktail"
        },
        {
          "name": "Chicken Wings",
          "price": "$15",
          "category": "food",
          "description": "Choose your flavour: Salsa Harra, Toum & Pomegranate Molasses, Tangy Cilantro Garlic, Salt Pepper & Lime, Smoked Paprika, BBQ. Served with fries"
        },
        {
          "name": "Fried Garlic Pita",
          "price": "$5",
          "category": "food",
          "description": "Fried garlic pita"
        },
        {
          "name": "Za'atar & Cheese Manakeesh",
          "price": "$12",
          "category": "food",
          "description": "Think Middle Eastern pizza"
        },
        {
          "name": "Cheese Rolls",
          "price": "$10",
          "category": "food",
          "description": "Feta, akawi & halloumi cheese rolled up and fried. Served with pressed yoghurt & fresh tomatoes"
        },
        {
          "name": "Makanik Mini Sandwich",
          "price": "$6",
          "category": "food",
          "description": "Housemade pita, lamb sausage, whipped garlic sauce, tomatoes, pomegranate molasses"
        },
        {
          "name": "Chicken Mini Sandwich",
          "price": "$6",
          "category": "food",
          "description": "Chicken shawarma, whipped garlic sauce, pickles"
        },
        {
          "name": "Halloumi Mini Sandwich",
          "price": "$6",
          "category": "food",
          "description": "Fried halloumi cheese, pomegranate molasses, pinenuts"
        },
        {
          "name": "Halloumi Fries",
          "price": "$10",
          "category": "food",
          "description": "Deep fried halloumi tossed in sumac, mint & pomegranate molasses"
        },
        {
          "name": "Loaded Lebanese Fries",
          "price": "$8",
          "category": "food",
          "description": "Fries, mozzarella, whipped garlic sauce, cilantro & chilli sauce"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "bimini-s-since-1975",
    "name": "Bimini's Since 1975",
    "formatted_address": "2010 W 4th Ave, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2678833,
        "lng": -123.1508689
      }
    },
    "formatted_phone_number": "(604) 739-0222",
    "website": "https://biminis1975.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://biminis1975.ca/happy-hours/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "between-2-buns-burgers",
    "name": "Between 2 Buns Burgers",
    "formatted_address": "105 E Pender St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.280567399999995,
        "lng": -123.10196699999999
      }
    },
    "formatted_phone_number": null,
    "website": "http://between2bunsburgers.ca/",
    "happy_hour": {
      "days": [
        5,
        6,
        0
      ],
      "start": "12:00",
      "end": "15:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.between2bunsburgers.ca/menu",
      "deals": [
        {
          "name": "Single Combo",
          "price": "$18.99",
          "category": "food",
          "description": "Single cheeser, fries and pop."
        },
        {
          "name": "Double Cheese Combo",
          "price": "$22.50",
          "category": "food",
          "description": "Double cheeser, fries and pop."
        },
        {
          "name": "Single Cheeser",
          "price": "$11.50",
          "category": "food",
          "description": "One patty, cheese, lettuce, pickles & B2B sauce (regular menu price $12.99)."
        },
        {
          "name": "Dirty Fries",
          "price": "$8.50",
          "category": "food",
          "description": "Fries loaded with B2B sauce, bacon and pickled jalapeños (regular menu price $11.00)."
        },
        {
          "name": "Dageraad Draft, 12 oz",
          "price": "$6",
          "category": "drink",
          "description": "Rotating taps."
        },
        {
          "name": "Dageraad Draft, 16 oz",
          "price": "$8",
          "category": "drink",
          "description": "Rotating taps."
        },
        {
          "name": "Dageraad Draft pitcher",
          "price": "$22",
          "category": "drink",
          "description": "Rotating taps."
        },
        {
          "name": "Sunrise Hotel Cocktails",
          "price": "$2 off",
          "category": "drink",
          "description": "Ask about available flavours."
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-butcher-bullock-public-house",
    "name": "The Butcher & Bullock Public House",
    "formatted_address": "911 W Pender St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.286226799999994,
        "lng": -123.1169446
      }
    },
    "formatted_phone_number": "(604) 662-8866",
    "website": "https://www.freehouse.co/locations/butcher-and-bullock?utm_source=google&utm_medium=organic&utm_campaign=gmb",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "16:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.freehouse.co/locations/butcher-and-bullock?utm_source=google&utm_medium=organic&utm_campaign=gmb",
      "deals": [
        {
          "name": "Beers",
          "price": "$5",
          "category": "drink",
          "description": "$5 beers during happy hour"
        },
        {
          "name": "Wine",
          "price": "$6",
          "category": "drink",
          "description": "$6 glasses of wine during happy hour"
        },
        {
          "name": "Margaritas",
          "price": "$9",
          "category": "drink",
          "description": "$9 margs during happy hour"
        },
        {
          "name": "Pizza",
          "price": "$5 off",
          "category": "food",
          "description": "$5 off pizza during happy hour"
        },
        {
          "name": "Burgers",
          "price": "$5 off",
          "category": "food",
          "description": "$5 off burgers during happy hour"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "carlos-o-bryan-s-neighborhood-pub",
    "name": "Carlos O'Bryan's Neighborhood Pub",
    "formatted_address": "1774 W 7th Ave, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2652838,
        "lng": -123.1453425
      }
    },
    "formatted_phone_number": "(604) 732-0010",
    "website": "http://kitsilanopub.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://kitsilanopub.com/",
      "deals": [
        {
          "name": "Single Highballs",
          "price": "$6.25",
          "category": "drink",
          "description": "1oz highball"
        },
        {
          "name": "Double Highballs",
          "price": "$9.25",
          "category": "drink",
          "description": "2oz highball"
        },
        {
          "name": "Domestic Draft Beer",
          "price": "$6.25",
          "category": "drink",
          "description": "16oz domestic draft"
        },
        {
          "name": "Premium Irish Pints",
          "price": "$8.75",
          "category": "drink",
          "description": "20oz premium Irish pint"
        },
        {
          "name": "House Wine",
          "price": "$7.75",
          "category": "drink",
          "description": "9oz glass of house wine"
        },
        {
          "name": "Pachos, Deep-Fried Pickles, Potato Skins",
          "price": "$12",
          "category": "food",
          "description": "Happy hour food tier 1"
        },
        {
          "name": "Chicken Lips, Dry Ribs, Classic Poutine, Chicken Quesadillas",
          "price": "$14",
          "category": "food",
          "description": "Happy hour food tier 2"
        },
        {
          "name": "Chicken Wings, McCracken Rolls, Irish Yorkies, Dunkin's Beef Dip",
          "price": "$16",
          "category": "food",
          "description": "Happy hour food tier 3"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-charlatan",
    "name": "The Charlatan",
    "formatted_address": "1447 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2715533,
        "lng": -123.0698961
      }
    },
    "formatted_phone_number": "(604) 253-2777",
    "website": "http://thecharlatanrestaurant.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://thecharlatanrestaurant.com/specials/happy-hour/",
      "deals": [
        {
          "name": "Snack size portions",
          "price": "$8",
          "category": "food",
          "description": "Any snack-size happy hour food item: Crispy Tofu Bites (Vg|Gf), Edamame (Ve|Vg|Gf), Cauliflower Wings (Vg), Tuna Bites, Bacon Wrapped Stuffed Dates, Beef Wellingtons, Chili Crisp Green Beans (Gf|Vg), Arancini (Ve)"
        },
        {
          "name": "Local craft beer",
          "price": "$6.5",
          "category": "drink",
          "description": "14oz pour, all local taps"
        },
        {
          "name": "Wine",
          "price": "$8.75",
          "category": "drink",
          "description": "6oz glass: Cono Sur Cabernet Sauvignon or Cono Sur Chardonnay"
        },
        {
          "name": "Botanicals",
          "price": "$7.5",
          "category": "drink",
          "description": "1oz. Empress Gin Spritzes (Cucumber Lemon, Elderflower Rose, Indigo) with honey syrup, lemon juice and soda; 21 Seeds Tequila Spritz (Cucumber Jalapeno, Grapefruit Hibiscus, Valencia Orange) with honey syrup, lime juice and soda"
        },
        {
          "name": "Party Fuel cocktails",
          "price": "$7.5",
          "category": "drink",
          "description": "1oz. Pick Me Up (vanilla vodka, espresso), Snake Oil (tequila, triple sec, blueberry lemonade), Buffalo Run (Buffalo Trace bourbon, Fireball)"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "opus-vancouver",
    "name": "OPUS Vancouver",
    "formatted_address": "322 Davie St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2746032,
        "lng": -123.12260169999999
      }
    },
    "formatted_phone_number": "(866) 642-6787",
    "website": "https://www.opushotel.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "17:30",
      "verified": false,
      "verified_source": null,
      "source_url": "https://opushotel.com/eat-drink/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "memphis-blues-barbeque-house",
    "name": "Memphis Blues Barbeque House",
    "formatted_address": "1342 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2724626,
        "lng": -123.06938280000001
      }
    },
    "formatted_phone_number": "(604) 215-2599",
    "website": "https://www.memphisbluesbbq.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.memphisbluesbbq.com/locations/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "caff-cittadella",
    "name": "Caffè Cittadella",
    "formatted_address": "2310 Ash St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.264803799999996,
        "lng": -123.11722979999999
      }
    },
    "formatted_phone_number": "(604) 568-5909",
    "website": "https://www.caffecittadella.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "16:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.caffecittadella.com/menu",
      "deals": [
        {
          "name": "Red or White Wine",
          "price": "$6.50",
          "category": "drink",
          "description": "6oz glass of house red or white wine"
        },
        {
          "name": "Chips and Salsa",
          "price": "$9.00",
          "category": "food",
          "description": "Add chips and salsa to your happy hour drink"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "fiorino-italian-street-food-chinatown-vancouver",
    "name": "Fiorino, Italian Street Food Chinatown Vancouver",
    "formatted_address": "212 E Georgia St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2784583,
        "lng": -123.0991914
      }
    },
    "formatted_phone_number": "(604) 568-0905",
    "website": "http://fiorinovancouver.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://fiorinovancouver.com/",
      "deals": [
        {
          "name": "Cicchetti",
          "price": "",
          "category": "food",
          "description": "Italian happy hour snacks (cicchetti) served 3PM-5PM; no prices listed on the cached pages"
        },
        {
          "name": "Happy hour drinks",
          "price": "",
          "category": "drink",
          "description": "Aperitivo drink specials 3PM-6PM; no prices listed on the cached pages"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "bombay-kitchen-and-bar-denman-st",
    "name": "Bombay Kitchen and Bar - Denman St",
    "formatted_address": "1061 Denman St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.288689899999994,
        "lng": -123.1401114
      }
    },
    "formatted_phone_number": "(604) 558-4445",
    "website": "https://bombaykitchenondenman.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://bombaykitchenondenman.ca/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "livia-forno-e-vino",
    "name": "LIVIA Forno e Vino",
    "formatted_address": "1399 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2722506,
        "lng": -123.06974659999997
      }
    },
    "formatted_phone_number": "(604) 423-3869",
    "website": "http://www.liviasweets.com/",
    "happy_hour": {
      "days": [
        0,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "13:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://www.liviasweets.com/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "forecast-coffee-main-street",
    "name": "Forecast Coffee - Main Street",
    "formatted_address": "2980 Main St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2584876,
        "lng": -123.1009593
      }
    },
    "formatted_phone_number": "(604) 559-6160",
    "website": "http://forecastcoffee.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://forecastcoffee.ca/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "noah-s-cafe",
    "name": "Noah's Cafe",
    "formatted_address": "1096 Denman St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2882755,
        "lng": -123.140033
      }
    },
    "formatted_phone_number": "(604) 559-1096",
    "website": "https://www.noahscafe604.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "17:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.noahscafe604.com/happy-hour",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "bartholomew",
    "name": "Bartholomew",
    "formatted_address": "1026 Mainland St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2760153,
        "lng": -123.1196449
      }
    },
    "formatted_phone_number": "(604) 423-4131",
    "website": "https://www.bartholomewbar.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "17:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.bartholomewbar.com/",
      "deals": [
        {
          "name": "Bart's Board",
          "price": "$19",
          "category": "food",
          "description": "3 meats & 3 cheeses, house accompaniments"
        },
        {
          "name": "Meatballs Sliders",
          "price": "$15",
          "category": "food",
          "description": "tomato braised pork, manchego, milk buns"
        },
        {
          "name": "Pan Con Tomate",
          "price": "$7",
          "category": "food",
          "description": ""
        },
        {
          "name": "Corn Queso Dip",
          "price": "$12",
          "category": "food",
          "description": "pickled peppers, cilantro, house chips"
        },
        {
          "name": "Jerk Fish Tacos",
          "price": "$12",
          "category": "food",
          "description": ""
        },
        {
          "name": "Bar Snacks",
          "price": "MP",
          "category": "food",
          "description": "market price"
        },
        {
          "name": "Bart's Margarita",
          "price": "$13",
          "category": "drink",
          "description": "el jimador blanco, tajin aperol, lime, agave"
        },
        {
          "name": "House Sangria",
          "price": "$12",
          "category": "drink",
          "description": "barrel-aged aperitivo, fresh orange & citrus, green apple shrub, merlot"
        },
        {
          "name": "Horchata Sour",
          "price": "$11",
          "category": "drink",
          "description": "flor de cana 7yr, pistachio horchata, lime, demerara, egg white, tonka bean"
        },
        {
          "name": "Pineapple Daiquiri",
          "price": "$11",
          "category": "drink",
          "description": "havana club, pineapple gomme, cucumber, lime"
        },
        {
          "name": "Wet Martini",
          "price": "$10",
          "category": "drink",
          "description": "tanqueray dry, lemon-verbena, basil oil"
        },
        {
          "name": "Beer-Groni",
          "price": "$13",
          "category": "drink",
          "description": "amaro & vermouth blend, cointreau, fresh grapefruit, pilsner"
        },
        {
          "name": "Draught Beer",
          "price": "$6.75",
          "category": "drink",
          "description": ""
        },
        {
          "name": "House Wine",
          "price": "$10",
          "category": "drink",
          "description": ""
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "bayside-lounge-english-bay",
    "name": "Bayside Lounge — English Bay",
    "formatted_address": "1755 Davie St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.28725120000001,
        "lng": -123.14139999999999
      }
    },
    "formatted_phone_number": "(604) 682-1831",
    "website": "https://www.baysidelounge.ca/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "12:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.baysidelounge.ca/menu?location=Location+1&menu=happy-hour",
      "deals": [
        {
          "name": "Corn Ribs",
          "price": "$10",
          "category": "food",
          "description": "Grilled corn on the cob brushed with sour cream mayo + cotija cheese, chili powder, paprika, cilantro + lime wedge. Vegetarian."
        },
        {
          "name": "Vegetarian Spring Rolls",
          "price": "$9",
          "category": "food",
          "description": "4 spring rolls served with sweet soy sauce, olives + pickled onions. Vegan, vegetarian, dairy free."
        },
        {
          "name": "Tuna Kinilaw",
          "price": "$11",
          "category": "food",
          "description": "Filipino style ceviche: coconut sap, thai chili, ginger, red onion, jalapeno, lime extract served with tortilla chips. Dairy free, gluten free."
        },
        {
          "name": "Chicken Karaage",
          "price": "$12",
          "category": "food",
          "description": "Pickled onion, asian slaw + yuzu aioli."
        },
        {
          "name": "Charred Brussels Sprouts",
          "price": "$7",
          "category": "food",
          "description": "Balsamic glaze + shaved parmesan. Vegetarian."
        },
        {
          "name": "Charcuterie Board",
          "price": "$17",
          "category": "food",
          "description": "Chef's selection of meats, cheeses, sundried tomato spread, olives, pickles, toasted breads + crackers."
        },
        {
          "name": "Chicken Drumettes",
          "price": "$13",
          "category": "food",
          "description": "Spicy BBQ sauce + blue cheese crumble."
        },
        {
          "name": "Spicy Crispy Calamari",
          "price": "$16.50",
          "category": "food",
          "description": "Served with sweet + sour tangy chili sauce."
        },
        {
          "name": "Elote Corn Salad",
          "price": "$12",
          "category": "food",
          "description": "Grilled corn, red peppers, jalapeno, cilantro + cotija cheese in a lime mayo + sour cream dressing. Add chicken $7 | Beyond meat $7 | Salmon $8 | Steak $11."
        },
        {
          "name": "The Burger",
          "price": "$16",
          "category": "food",
          "description": "House-made angus beef burger, bacon, cheddar, sauteed mushrooms, lettuce, tomato, red onion, pickle + chipotle aioli on a brioche bun. Served with fries, yam fries, caesar or house salad."
        },
        {
          "name": "The Beyond Burger",
          "price": "$16",
          "category": "food",
          "description": "Vegan beyond meat patty, vegan cheddar, caramelized onions, arugula + vegan sriracha aioli on a pretzel bun. Served with fries, yam fries, caesar or house salad."
        },
        {
          "name": "Sous-Vide Steak Sandwich",
          "price": "$22",
          "category": "food",
          "description": "5oz sous-vide sirloin, sauteed mushrooms, buttermilk fried onions + chimi aioli on ciabatta bread. Served with fries, yam fries, caesar or house salad."
        },
        {
          "name": "Pistachio Crusted Roasted Mahi Mahi",
          "price": "$20",
          "category": "food",
          "description": "House-made pistachio lime butter served with mashed potatoes + asparagus. Gluten free."
        },
        {
          "name": "Penne Alla Vodka",
          "price": "$20",
          "category": "food",
          "description": "Penne tossed in tomato cream sauce with vodka, sauteed garlic, chili flakes, parmesan + fresh herb. Add chicken $7 | Beyond meat $7 | Salmon $8 | Steak $11."
        },
        {
          "name": "Mini Donuts",
          "price": "$6.5",
          "category": "food",
          "description": "Topped with cinnamon sugar + chocolate sauce. Vegetarian."
        },
        {
          "name": "Draft Beer",
          "price": "$6",
          "category": "drink",
          "description": "Lager, pale ale or rotating tap."
        },
        {
          "name": "House Wine",
          "price": "$6",
          "category": "drink",
          "description": "Jackson-Triggs Chardonnay or Cabernet Sauvignon."
        },
        {
          "name": "Premium Wine",
          "price": "$8",
          "category": "drink",
          "description": "Red Rooster Pinot Noir or Pinot Gris."
        },
        {
          "name": "Classic Caesar",
          "price": "$7.5",
          "category": "drink",
          "description": "Single $7.50; double $9.75."
        },
        {
          "name": "Highball",
          "price": "$6",
          "category": "drink",
          "description": "Vodka, gin, white rum, dark rum, rye or tequila with soda, Pepsi, Diet Pepsi, cranberry, ginger ale, 7Up, water, tonic or pineapple juice. Single $6; double $9.25."
        },
        {
          "name": "Cocktails",
          "price": "$9.75",
          "category": "drink",
          "description": "Cosmo, Cucumber Collins or Bourbon Sour."
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-cider-house",
    "name": "The Cider House",
    "formatted_address": "1602 Yew St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.271510799999994,
        "lng": -123.1548246
      }
    },
    "formatted_phone_number": "(604) 558-1975",
    "website": "https://ciderhouserules.ca/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4
      ],
      "start": "16:00",
      "end": "17:30",
      "verified": false,
      "verified_source": null,
      "source_url": "https://ciderhouserules.ca/happy-hour/",
      "deals": [
        {
          "name": "Select cider",
          "price": "$2 off",
          "category": "drink",
          "description": "12oz pours of Mango Mint, Strawberry Lychee, Pina Colada, or Blackberry Hibiscus (7% ABV)"
        },
        {
          "name": "Cider House Flight",
          "price": "$15",
          "category": "drink",
          "description": "16oz curated tasting of all rotating ciders, one pour of each"
        },
        {
          "name": "Fizzy Crush",
          "price": "$6",
          "category": "drink",
          "description": "1oz; soda water with choice of vodka, gin, or tequila, topped with passionfruit slush"
        },
        {
          "name": "Red Sangria",
          "price": "$10",
          "category": "drink",
          "description": "Glass $10 / pitcher $35; red wine, blackberry hibiscus cider, passion fruit juice, orange juice and fresh lime"
        },
        {
          "name": "Passionfruit Slushy Marg",
          "price": "$11",
          "category": "drink",
          "description": "1.5oz; tequila, lime & passionfruit slush"
        },
        {
          "name": "Cider House Spritz",
          "price": "$12",
          "category": "drink",
          "description": "1.5oz; Aperol topped with dry cider, finished with a fresh orange wedge"
        },
        {
          "name": "Cerveza",
          "price": "$7",
          "category": "drink",
          "description": "12oz lager by Main Street Brewing, 5% ABV"
        },
        {
          "name": "House Wine",
          "price": "$9-12",
          "category": "drink",
          "description": "Cabernet Sauvignon or Pinot Gris; $9 for 6oz, $12 for 9oz"
        },
        {
          "name": "Wine & bubbles bottles",
          "price": "15% off",
          "category": "drink",
          "description": "15% off all wine bottles & sparkling wines"
        },
        {
          "name": "Phillips Non-Alc",
          "price": "$5",
          "category": "drink",
          "description": "12oz Pale Ale or Pilsner, 0.05% ABV"
        },
        {
          "name": "Brain Freeze",
          "price": "$6",
          "category": "drink",
          "description": "Non-alcoholic passionfruit slush cocktail"
        },
        {
          "name": "Fraser Valley Sparkling Water",
          "price": "$4",
          "category": "drink",
          "description": "Strawberry Guava or Wild Mountain Berry"
        },
        {
          "name": "Maple Rosemary Peanuts",
          "price": "$5",
          "category": "food",
          "description": "GF; sweet, savory, herb-roasted peanuts with a maple finish"
        },
        {
          "name": "Mini Nachos",
          "price": "$12",
          "category": "food",
          "description": "GF; pico de gallo, black olives, pickled onion, jalapeño, queso, mozza style cheese, cashew sour cream. Add guac $4, salsa $3, vegan beef $5, jackfruit $5"
        },
        {
          "name": "Single Taco",
          "price": "$5",
          "category": "food",
          "description": "GF; al pastor-style pulled jackfruit with pineapple salsa, jalapeño aioli, and onion on a corn tortilla"
        },
        {
          "name": "Single Tostada",
          "price": "$7",
          "category": "food",
          "description": "GF; watermelon crudo tostada with cucumber, salsa verde, and pickled onion"
        },
        {
          "name": "Deep-Fried Pickle Chips",
          "price": "$10",
          "category": "food",
          "description": "GF; light rice flour batter, served with house burger sauce"
        },
        {
          "name": "Corn Ribs",
          "price": "$10",
          "category": "food",
          "description": "GF; crispy corn ribs with smoky Mexican spice mix, drizzled with lemon mayo"
        },
        {
          "name": "Chips and Salsa",
          "price": "$10",
          "category": "food",
          "description": "GF; house salsa with fresh corn chips"
        },
        {
          "name": "Tofu Bites",
          "price": "$13",
          "category": "food",
          "description": "GF; maple and chili tofu bites with sesame and green onion"
        },
        {
          "name": "Yam Fries",
          "price": "$11",
          "category": "food",
          "description": "GF; crispy yam fries with tangy chipotle dip"
        },
        {
          "name": "Loaded Fries",
          "price": "$12",
          "category": "food",
          "description": "GF; fries topped with crumbled Beyond Meat, pico de gallo, pickled onion, jalapeños, olives, lemon mayo, and salsa verde"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "bar-corso",
    "name": "Bar Corso",
    "formatted_address": "1566 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2707543,
        "lng": -123.069445
      }
    },
    "formatted_phone_number": "(604) 336-9466",
    "website": "http://www.barcorso.ca/",
    "happy_hour": {
      "days": [
        2,
        3,
        4
      ],
      "start": "17:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.barcorso.ca/menus",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "song-by-kin-kao",
    "name": "Song (by Kin Kao)",
    "formatted_address": "317 E Broadway, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2629666,
        "lng": -123.0986446
      }
    },
    "formatted_phone_number": "(604) 568-0400",
    "website": "http://www.songyvr.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        3,
        4,
        5,
        6
      ],
      "start": "17:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.songyvr.com/menu",
      "deals": [
        {
          "name": "Tom Yum",
          "price": "$19",
          "category": "drink",
          "description": "Cocktail: rum, sweet vermouth, Campari, tom yum & tamarind acid solution (regular $22)"
        },
        {
          "name": "Rice",
          "price": "$17",
          "category": "drink",
          "description": "Cocktail: scotch, toasted rice, Cha Tra Mue & khao khua (regular $20)"
        },
        {
          "name": "Lychee",
          "price": "$18",
          "category": "drink",
          "description": "Cocktail: gin, fino sherry, lychee, pandan, lemon & brine (regular $21)"
        },
        {
          "name": "Jaew",
          "price": "$18",
          "category": "drink",
          "description": "Cocktail: tequila, lime leaf, bell pepper, lime & jaew (regular $21)"
        },
        {
          "name": "Toasted Rice Cream Soda",
          "price": "$18",
          "category": "drink",
          "description": "Cocktail: toasted rice, rice wine, tonka bean & carbonation (regular $21)"
        },
        {
          "name": "Tom Kah",
          "price": "$17",
          "category": "drink",
          "description": "Cocktail: tequila, lime leaf, galangal, ginger, carbonation & coconut pandan foam (regular $19)"
        },
        {
          "name": "Averill Creek Charme De L'ile",
          "price": "$12",
          "category": "drink",
          "description": "Sparkling wine, Duncan, BC (regular $15)"
        },
        {
          "name": "Scout '25 Orange",
          "price": "$12",
          "category": "drink",
          "description": "Epicure, La Crescent, Gewurztraminer, Pinot Gris and Riesling, Cawston (regular $15)"
        },
        {
          "name": "Little Farm Chardonnay",
          "price": "$12",
          "category": "drink",
          "description": "2020 Mulberry Tree Vineyard Chardonnay, Similkameen Valley, BC (regular $15)"
        },
        {
          "name": "Sage Hills Merlot",
          "price": "$12",
          "category": "drink",
          "description": "100% organic Merlot, Okanagan Valley, on tap (regular $15)"
        },
        {
          "name": "Draft Beer",
          "price": "$8",
          "category": "drink",
          "description": "Rotating taps (regular $9-10)"
        },
        {
          "name": "Toasted Rice Cream Soda (NA)",
          "price": "$13",
          "category": "drink",
          "description": "Non-alcoholic: toasted rice, tonka bean & carbonation (regular $15)"
        },
        {
          "name": "Green Papaya (NA)",
          "price": "$13",
          "category": "drink",
          "description": "Non-alcoholic, served frozen: green papaya, salted coconut foam & Thai basil (regular $15)"
        },
        {
          "name": "Tom Kah (NA)",
          "price": "$13",
          "category": "drink",
          "description": "Non-alcoholic: lime leaf, galangal, ginger, carbonation & coconut pandan foam (regular $15)"
        },
        {
          "name": "Mango (NA)",
          "price": "$13",
          "category": "drink",
          "description": "Non-alcoholic: mango puree, pandan rice milk & coconut pandan foam (regular $15)"
        },
        {
          "name": "Thai Tea",
          "price": "$6",
          "category": "drink",
          "description": "Sweetened black tea & evaporated milk (regular $8)"
        },
        {
          "name": "Oysters",
          "price": "$8",
          "category": "food",
          "description": "2 fresh daily Fanny Bay oysters with house spicy nam jim seafood sauce, Thai chili paste, crispy shallot and micro greens (regular $12)"
        },
        {
          "name": "Calamari",
          "price": "$11",
          "category": "food",
          "description": "Deep fried squid, pickled banana pepper, served with tom yum mayo"
        },
        {
          "name": "Grilled Corn",
          "price": "$10",
          "category": "food",
          "description": "Fresh grilled corn coated with salted egg yolk, butter and coriander (vegetarian)"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "main-street-brewing-co",
    "name": "Main Street Brewing Co.",
    "formatted_address": "261 E 7th Ave, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2646765,
        "lng": -123.0992152
      }
    },
    "formatted_phone_number": "(604) 336-7711",
    "website": "http://mainstreetbeer.ca/",
    "happy_hour": {
      "days": [
        0,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.mainstreetbeer.ca/happy-hour",
      "deals": [
        {
          "name": "Draft (16oz)",
          "price": "$6",
          "category": "drink",
          "description": "16oz draft: Main Street Premium Pilsner, Naked Fox West Coast IPA, Kingpin Juicy Hazy Pale Ale, or Krush Crisp Lager"
        },
        {
          "name": "Cask (20oz)",
          "price": "$6.75",
          "category": "drink",
          "description": "20oz cask pour"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "switch",
    "name": "SWITCH",
    "formatted_address": "1339 Robson St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.287591899999995,
        "lng": -123.12906059999999
      }
    },
    "formatted_phone_number": "(604) 264-7026",
    "website": "https://switch-vancouver.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://switch-vancouver.ca/wp-content/uploads/2025/10/HAPPY-HOUR-MENU-2025-10.pdf",
      "deals": [
        {
          "name": "Edamame",
          "price": "$3.50",
          "category": "food",
          "description": "Chilled soybean, sea salted"
        },
        {
          "name": "Olive Tapenade",
          "price": "$4.50",
          "category": "food",
          "description": "Chopped olives, capers, parsley, crostini"
        },
        {
          "name": "Mixed Nuts",
          "price": "$5.50",
          "category": "food",
          "description": "Rotating blend"
        },
        {
          "name": "Chips & Pineapple Salsa",
          "price": "$6.50",
          "category": "food",
          "description": "Corn tortilla chips, fresh pineapple salsa"
        },
        {
          "name": "Sockeye Salmon Dip",
          "price": "$7.50",
          "category": "food",
          "description": "Smoked sockeye salmon, cream cheese, horseradish, capers, dill, crostini"
        },
        {
          "name": "Yuzu Mimosa",
          "price": "$3.50",
          "category": "drink",
          "description": "Zero proof"
        },
        {
          "name": "Non-Alcoholic Beer",
          "price": "$4.50",
          "category": "drink",
          "description": "Ask server for selections"
        },
        {
          "name": "Crystal",
          "price": "$5.50",
          "category": "drink",
          "description": "Premium craft lager, 5.0%, 420ml"
        },
        {
          "name": "Guinness",
          "price": "$6.50",
          "category": "drink",
          "description": "Irish stout, 4.2%, 420ml"
        },
        {
          "name": "White Peaks",
          "price": "$7.50",
          "category": "drink",
          "description": "Low-sugar black tea with lemon, 5.0%, 420ml"
        },
        {
          "name": "Fizzy One",
          "price": "$8.50",
          "category": "drink",
          "description": "Brut sparkling wine, 150ml"
        },
        {
          "name": "Karaoke Room Rate",
          "price": "$5.00",
          "category": "drink",
          "description": "Happy Hour Karaoke room rate per person; minimum charge of $5.00 applies. Runs 2pm-6pm daily and all day Wednesday"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "uncle-abe-s",
    "name": "Uncle Abe's",
    "formatted_address": "3032 Main St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2581133,
        "lng": -123.10082609999998
      }
    },
    "formatted_phone_number": null,
    "website": "http://www.uncleabes.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "16:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://www.uncleabes.ca/",
      "deals": [
        {
          "name": "Happy Hour Cocktails",
          "price": "$10 ea",
          "category": "drink",
          "description": "2oz cocktails: Long Island Iced Tea, Shaft (Polar Ice vodka, Carolan's, Kahlua, cold brew), Moscow Mule (Polar Ice vodka, lime, ginger beer)"
        },
        {
          "name": "Pickleback Shot",
          "price": "$5",
          "category": "drink",
          "description": "1oz pickleback shot (regular price $7)"
        },
        {
          "name": "Abe's Lager",
          "price": "$5",
          "category": "drink",
          "description": "16oz Uncle Abe's Lager on draft"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-watson",
    "name": "The Watson",
    "formatted_address": "3080 Main St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2577372,
        "lng": -123.1008267
      }
    },
    "formatted_phone_number": "(604) 559-5266",
    "website": "https://www.thewatson.ca/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "16:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.thewatson.ca/",
      "deals": [
        {
          "name": "Happy Hour Cocktails",
          "price": "$11-14",
          "category": "drink",
          "description": "Watson's Gimlet (gin, basil, lime leaf, fresh lime); Blue Pony Club (flor de cana 4yr, blue pineapple gomme, lime); Paloma (el jimador blanco, aperol, cacao, orange, acid); The Watson (tanqueray, blanco vermouth blend, averna, orange bitters, barrel aged); Sbagliato (house amer picon, campari, bubbles)"
        },
        {
          "name": "Draught Beer",
          "price": "$6.75",
          "category": "drink",
          "description": "Happy hour draught beer"
        },
        {
          "name": "House Wine",
          "price": "$10",
          "category": "drink",
          "description": "Happy hour house wine"
        },
        {
          "name": "Chorizo in Red Wine",
          "price": "$10",
          "category": "food",
          "description": "Happy hour food menu item"
        },
        {
          "name": "Bread & Burrata",
          "price": "$12",
          "category": "food",
          "description": "Happy hour food menu item"
        },
        {
          "name": "Wild Boar Carnitas",
          "price": "$12",
          "category": "food",
          "description": "Happy hour food menu item"
        },
        {
          "name": "Sweet & Spicy Nuts",
          "price": "$7",
          "category": "food",
          "description": "Happy hour food menu item"
        },
        {
          "name": "Grilled Prawns",
          "price": "$13",
          "category": "food",
          "description": "Happy hour food menu item"
        },
        {
          "name": "Confit Tuna",
          "price": "$14",
          "category": "food",
          "description": "Happy hour food menu item"
        },
        {
          "name": "Smoked Olives",
          "price": "$7",
          "category": "food",
          "description": "Applewood smoked olives"
        },
        {
          "name": "Harissa Carrots",
          "price": "$11",
          "category": "food",
          "description": "Happy hour food menu item"
        },
        {
          "name": "Patatas Bravas",
          "price": "$8",
          "category": "food",
          "description": "Happy hour food menu item"
        },
        {
          "name": "Caramelized Onion Dip",
          "price": "$13",
          "category": "food",
          "description": "Happy hour food menu item"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "junction",
    "name": "Junction",
    "formatted_address": "1138 Davie St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.280732300000004,
        "lng": -123.1322662
      }
    },
    "formatted_phone_number": "(604) 669-2013",
    "website": "http://www.junctionpub.com/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "13:30",
      "end": "16:30",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.junctionpub.com/happy-hour",
      "deals": [
        {
          "name": "Draft beer",
          "price": "$6.25",
          "category": "drink",
          "description": "Draft beers"
        },
        {
          "name": "House wine",
          "price": "$6.25",
          "category": "drink",
          "description": "6oz glass of house wine"
        },
        {
          "name": "Growers cider",
          "price": "$6.50",
          "category": "drink",
          "description": "Growers ciders"
        },
        {
          "name": "Jameson shot",
          "price": "$6.25",
          "category": "drink",
          "description": "Shot of Jameson"
        },
        {
          "name": "Well highball",
          "price": "$6",
          "category": "drink",
          "description": "Single well highballs: Polar Ice Vodka, Lambs White or Dark Rum, Beefeater Gin, Wisers Rye, Ballantines Scotch"
        },
        {
          "name": "Beef burger",
          "price": "$10",
          "category": "food",
          "description": "Beef burger with fries"
        },
        {
          "name": "Select appies",
          "price": "$9.50",
          "category": "food",
          "description": "Onion rings, yam fries or spring rolls"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "mum-s-the-word",
    "name": "Mum's The Word",
    "formatted_address": "1301 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.272939,
        "lng": -123.06978399999998
      }
    },
    "formatted_phone_number": "(604) 251-6246",
    "website": "http://mumsvancouver.com/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "14:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.mumsvancouver.com/happy-hour",
      "deals": [
        {
          "name": "Mum's 'After School' Grilled Cheese",
          "price": "$8",
          "category": "food",
          "description": "Provolone and onion jam served on Fife Bakery Sourdough (regular menu price $10)"
        },
        {
          "name": "Laugh-a-Lot Lager (14oz)",
          "price": "$5",
          "category": "drink",
          "description": "Mum's house lager (Phillips Brewing, Victoria BC); regular menu price $7"
        },
        {
          "name": "Idleback Amber Ale",
          "price": "$6",
          "category": "drink",
          "description": "Slackwater Brewing, Port Moody BC; regular menu price $8"
        },
        {
          "name": "Highballs",
          "price": "$5 single / $9 double",
          "category": "drink",
          "description": "Smirnoff Vodka, Gordon's Gin, Jose Cuervo Tequila, Wiser's Special Blend Whiskey, or Captain Morgan's White Rum"
        },
        {
          "name": "Wine (6oz)",
          "price": "$11",
          "category": "drink",
          "description": "White: The Hatch 'B Yanco'; Red: The Hatch 'Gobsmacked Flipping the Bird'; Rose: The Hatch Ross-O"
        },
        {
          "name": "Fiesta",
          "price": "$26",
          "category": "drink",
          "description": "Four bottles of Modelo Especial"
        },
        {
          "name": "Shaft",
          "price": "1oz $5 / 2oz $9",
          "category": "drink",
          "description": "Smirnoff vodka, Kahlua, cold brew"
        },
        {
          "name": "Army Navy (2oz)",
          "price": "$10",
          "category": "drink",
          "description": "Gin, oat orgeat, lemon, angostura"
        },
        {
          "name": "Hotel Saskatchewan (2oz)",
          "price": "$10",
          "category": "drink",
          "description": "Rye, lemon, honey"
        },
        {
          "name": "Daiquiri (2oz)",
          "price": "$10",
          "category": "drink",
          "description": "Rum, lime, cane sugar"
        },
        {
          "name": "Tommy's Margarita (2oz)",
          "price": "$10",
          "category": "drink",
          "description": "Tequila, agave, lime"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-old-spaghetti-factory-gastown",
    "name": "The Old Spaghetti Factory (Gastown)",
    "formatted_address": "53 Water St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.283731599999996,
        "lng": -123.1052059
      }
    },
    "formatted_phone_number": "(604) 684-1288",
    "website": "http://www.oldspaghettifactory.ca/locations/gastown",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://www.oldspaghettifactory.ca/locations/gastown",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "dae-bak-bon-ga",
    "name": "Dae Bak Bon Ga",
    "formatted_address": "1323 Robson St #201 Vancouver, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2874054,
        "lng": -123.1288126
      }
    },
    "formatted_phone_number": "(604) 683-9298",
    "website": "http://www.daebakbonga.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4
      ],
      "start": "21:00",
      "end": "22:30",
      "verified": false,
      "verified_source": null,
      "source_url": "http://www.daebakbonga.com/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-sandbar-seafood-restaurant",
    "name": "The Sandbar Seafood Restaurant",
    "formatted_address": "1535 Johnston St Creekhouse #102, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.271533299999994,
        "lng": -123.1342317
      }
    },
    "formatted_phone_number": "(604) 669-9030",
    "website": "https://www.vancouverdine.com/sandbar",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.vancouverdine.com/sandbar/menus/",
      "deals": [
        {
          "name": "Parmesan Truffle Fries",
          "price": "$7.50",
          "category": "food",
          "description": "roasted garlic aioli"
        },
        {
          "name": "Fresh Shucked Oysters",
          "price": "$12 / $24",
          "category": "food",
          "description": "market price; half dozen 12, one dozen 24"
        },
        {
          "name": "Signature Wok Squid",
          "price": "$14.50",
          "category": "food",
          "description": "ginger, chilies, onions, chili-lime aioli"
        },
        {
          "name": "Fish & Chips",
          "price": "$13.50",
          "category": "food",
          "description": "house-made coleslaw, tartar sauce"
        },
        {
          "name": "Crab & Artichoke Dip",
          "price": "$13.50",
          "category": "food",
          "description": "served with tortilla chips"
        },
        {
          "name": "Wok Tossed Mussels",
          "price": "$14.50",
          "category": "food",
          "description": "white wine garlic sauce"
        },
        {
          "name": "Hummus",
          "price": "$12.50",
          "category": "food",
          "description": "olive tapenade, feta, grilled naan"
        },
        {
          "name": "Seasonal Draft",
          "price": "$6",
          "category": "drink",
          "description": "rotating seasonal draft beer"
        },
        {
          "name": "House Red or White Wine",
          "price": "$6 / $9",
          "category": "drink",
          "description": "house red or white by the glass, two pour sizes"
        },
        {
          "name": "Sandbar Highballs",
          "price": "$6 / $9",
          "category": "drink",
          "description": "6 single, 9 double"
        },
        {
          "name": "Classic Margarita",
          "price": "$10",
          "category": "drink",
          "description": "signature cocktail"
        },
        {
          "name": "Mojito",
          "price": "$10",
          "category": "drink",
          "description": "signature cocktail"
        },
        {
          "name": "Whisky Sour",
          "price": "$10",
          "category": "drink",
          "description": "signature cocktail"
        },
        {
          "name": "Negroni",
          "price": "$10",
          "category": "drink",
          "description": "signature cocktail"
        },
        {
          "name": "Signature Caesar",
          "price": "$10",
          "category": "drink",
          "description": "signature cocktail"
        },
        {
          "name": "Moscow Mule",
          "price": "$10",
          "category": "drink",
          "description": "signature cocktail"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "minami",
    "name": "Minami",
    "formatted_address": "1118 Mainland St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2752389,
        "lng": -123.12075779999999
      }
    },
    "formatted_phone_number": "(604) 685-8080",
    "website": "http://minamirestaurant.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.minamirestaurant.com/menu",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "top-of-vancouver-revolving-restaurant",
    "name": "Top Of Vancouver Revolving Restaurant",
    "formatted_address": "555 W Hastings St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2845838,
        "lng": -123.11218179999999
      }
    },
    "formatted_phone_number": "(604) 669-2220",
    "website": "https://topofvancouver.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://topofvancouver.com/menus/",
      "deals": [
        {
          "name": "Soup of the Day",
          "price": "$14",
          "category": "food",
          "description": "Ask your server for the daily selection"
        },
        {
          "name": "Top of Vancouver Fries",
          "price": "$14",
          "category": "food",
          "description": "House fries"
        },
        {
          "name": "Arancini Margarita (3)",
          "price": "$16",
          "category": "food",
          "description": "Vegetarian crisp risotto balls"
        },
        {
          "name": "Tomato Bocconcini Caprese",
          "price": "$16",
          "category": "food",
          "description": "Gluten-free, vegetarian"
        },
        {
          "name": "Wings and Drummettes (6)",
          "price": "$20",
          "category": "food",
          "description": "Garlic butter or Buffalo hot; add side ranch or blue cheese $2"
        },
        {
          "name": "Jumbo Prawn Cocktail (3)",
          "price": "$20",
          "category": "food",
          "description": "Gluten-free"
        },
        {
          "name": "Steamed Mussels",
          "price": "$20",
          "category": "food",
          "description": "Gluten-free"
        },
        {
          "name": "Chicken Tenders and Fries",
          "price": "$24",
          "category": "food",
          "description": "Served with plum sauce"
        },
        {
          "name": "Antipasto",
          "price": "$28",
          "category": "food",
          "description": "Cured meats, cheese, pickles, olives"
        },
        {
          "name": "Salmon Tartare",
          "price": "$30",
          "category": "food",
          "description": "From dinner menu at happy hour price; ponzu sesame dressing, avocado, red onion, sunflower seeds, olive oil"
        },
        {
          "name": "Wagyu Beef Carpaccio",
          "price": "$34",
          "category": "food",
          "description": "From dinner menu at happy hour price; parmesan, arugula, olives, pickled onions, horseradish aioli, truffle oil"
        },
        {
          "name": "House Red, White or Rose",
          "price": "$12-16",
          "category": "drink",
          "description": "6oz $12 / 9oz $16"
        },
        {
          "name": "Rotating Draft (20oz)",
          "price": "$11.5",
          "category": "drink",
          "description": "Ask your server for the current tap"
        },
        {
          "name": "Slackwater Brewery Amber Ale (20oz)",
          "price": "$11.5",
          "category": "drink",
          "description": "5.5% amber ale"
        },
        {
          "name": "Rewind Brewery Lazer Lite Lager (20oz)",
          "price": "$11.5",
          "category": "drink",
          "description": "4.0% lager"
        },
        {
          "name": "Villa Teresa Prosecco",
          "price": "$20",
          "category": "drink",
          "description": "375ml bottle"
        },
        {
          "name": "Rail Highballs",
          "price": "$11-15",
          "category": "drink",
          "description": "1oz $11 / 2oz $15; Canadian Club, Beefeater, El Jimador, Skyy Vodka, Captain Morgan"
        },
        {
          "name": "Deluxe Highballs",
          "price": "$14-19",
          "category": "drink",
          "description": "1oz $14 / 2oz $19; Forty Creek, Lot 40, Grey Goose, Tanqueray 10, Casamigos, Bumbu XO"
        },
        {
          "name": "TOV Caesar",
          "price": "$15-18.5",
          "category": "drink",
          "description": "1oz $15 / 2oz $18.50; 'Resurrection' garlic vodka, clamato, Tabasco & Worcestershire, steak spice rim"
        },
        {
          "name": "Pineapple Inferno",
          "price": "$15-18",
          "category": "drink",
          "description": "1oz $15 / 2oz $18; Dulce Vida pineapple & jalapeno tequila, fresh pineapple, lime, soda"
        },
        {
          "name": "Hibiscus Margarita",
          "price": "$16",
          "category": "drink",
          "description": "2oz; reposado tequila, cointreau, fresh lime, hibiscus syrup, half salted rim"
        },
        {
          "name": "Caramel Pick Me Up",
          "price": "$16",
          "category": "drink",
          "description": "2oz; Van Gogh caramel vodka, Baileys, Kahlua, chilled espresso"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-vancouver-fish-company",
    "name": "The Vancouver Fish Company",
    "formatted_address": "1517 Anderson St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.270652899999995,
        "lng": -123.1366116
      }
    },
    "formatted_phone_number": "(604) 559-3474",
    "website": "https://www.vanfish.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://vanfish.com/menus/menus_dining_happy_hour/",
      "deals": [
        {
          "name": "Draught Beer",
          "price": "$6",
          "category": "drink",
          "description": "Red Truck Lager & Amber Ale"
        },
        {
          "name": "Single Highballs",
          "price": "$7",
          "category": "drink",
          "description": "Single highballs"
        },
        {
          "name": "Wine by the glass",
          "price": "$8",
          "category": "drink",
          "description": "House white & red"
        },
        {
          "name": "Kyoto Sour",
          "price": "$13",
          "category": "drink",
          "description": "Sake, Sheringham Gin, grapefruit, lime, agave, green tabasco"
        },
        {
          "name": "Raincity Refresher",
          "price": "$12",
          "category": "drink",
          "description": "Gin, cucumber, rosemary sage simple syrup, lemon juice, soda"
        },
        {
          "name": "Fresh Shucked West Coast Oysters",
          "price": "$3 each",
          "category": "food",
          "description": "West Coast, ask your server for today's daily selection, minimum order of 6"
        },
        {
          "name": "Maple Walnut Prawns",
          "price": "$9",
          "category": "food",
          "description": "Lightly fried VFC tempura prawns, yuzu mayo, walnuts, toasted sesame, togarashi; +add maple walnut prawn $3.5"
        },
        {
          "name": "Mussels & Frites",
          "price": "$19",
          "category": "food",
          "description": "Salt Spring Island mussels, pork chorizo, creamed leeks, fries"
        },
        {
          "name": "Boneless Chicken Wings",
          "price": "$14",
          "category": "food",
          "description": "Crispy fried chicken thighs, Frank's Red Hot & butter, chives"
        },
        {
          "name": "Caesar Salad",
          "price": "$7",
          "category": "food",
          "description": "Chilled romaine, white anchovy, croutons, parmesan"
        },
        {
          "name": "Garlic Bread",
          "price": "$3",
          "category": "food",
          "description": "Garlic herb butter, toasted baguette"
        },
        {
          "name": "Fries",
          "price": "$4",
          "category": "food",
          "description": "Fries"
        },
        {
          "name": "Wild Salmon",
          "price": "$35",
          "category": "food",
          "description": "Seared salmon, seasonal vegetables, garlic roasted potatoes, watercress & fennel salad, herb beurre blanc"
        },
        {
          "name": "1 pc Halibut & Fries",
          "price": "$21",
          "category": "food",
          "description": "Granville Island beer-battered, cabbage & carrot slaw, tartar sauce, lemon"
        },
        {
          "name": "Seafood Linguini",
          "price": "$26",
          "category": "food",
          "description": "Local sustainable seafood, prawns, sundried tomato cream sauce"
        },
        {
          "name": "Striploin",
          "price": "$45",
          "category": "food",
          "description": "Two Rivers AAA striploin, herb roasted potatoes, seasonal vegetables, red wine jus, garlic butter"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "gotham-steakhouse-cocktail-bar",
    "name": "Gotham Steakhouse & Cocktail Bar",
    "formatted_address": "615 Seymour St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.282900999999995,
        "lng": -123.11588449999999
      }
    },
    "formatted_phone_number": "(604) 605-8282",
    "website": "http://www.gothamsteakhouse.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.gothamsteakhouse.com/2026/07/13/social-hour-at-gotham",
      "deals": [
        {
          "name": "Champagne & sparkling wine",
          "price": "40% off",
          "category": "drink",
          "description": "40% off all Champagne and sparkling wine"
        },
        {
          "name": "Local beer",
          "price": "$7.50",
          "category": "drink",
          "description": "Local beers"
        },
        {
          "name": "Feature wine",
          "price": "$10.50",
          "category": "drink",
          "description": "Feature wines by the glass"
        },
        {
          "name": "Well highballs",
          "price": "$8",
          "category": "drink",
          "description": "Well highballs"
        },
        {
          "name": "Oysters",
          "price": "$22.75",
          "category": "food",
          "description": "Fresh oysters, per half dozen"
        },
        {
          "name": "Prime Beef Sliders",
          "price": "$19.50",
          "category": "food",
          "description": "From the Social Hour menu"
        },
        {
          "name": "Seymour Street Fried Chicken",
          "price": "$16.50",
          "category": "food",
          "description": "From the Social Hour menu"
        },
        {
          "name": "Steak & Prawn Skewers",
          "price": "$17.00",
          "category": "food",
          "description": "From the Social Hour menu"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "sylvia-hotel-restaurant-and-lounge",
    "name": "Sylvia Hotel, Restaurant and Lounge",
    "formatted_address": "1154 Gilford St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2885546,
        "lng": -123.1426087
      }
    },
    "formatted_phone_number": "(877) 681-9321",
    "website": "https://sylviahotel.com/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://sylviahotel.com/restaurant-lounge/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-pawn-shop-yvr-taco-bar",
    "name": "The Pawn Shop YVR Taco Bar",
    "formatted_address": "1117 Granville St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.278149299999995,
        "lng": -123.1252321
      }
    },
    "formatted_phone_number": "(604) 687-7474",
    "website": "https://thepawnshopyvr.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "12:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://thepawnshopyvr.com/happy-hour/",
      "deals": [
        {
          "name": "Pawn Shop Lager",
          "price": "$5.95",
          "category": "drink",
          "description": "Pawn Shop Lager by Stanley Park, 14oz draught"
        },
        {
          "name": "House Tequila Shot",
          "price": "$5.95",
          "category": "drink",
          "description": "1oz house tequila"
        },
        {
          "name": "Spiked Slush",
          "price": "$5.95",
          "category": "drink",
          "description": "1oz vodka, rum, gin, whiskey or tequila with choice of mix"
        },
        {
          "name": "House Highball",
          "price": "$5.95",
          "category": "drink",
          "description": "Pick your weapon (1oz vodka, rum, gin, whiskey or tequila) plus a mix: soda, coke, diet coke, tonic, ginger ale, cranberry, orange juice, mango, guava, sprite or grapefruit"
        },
        {
          "name": "Premium Slush",
          "price": "$8.95",
          "category": "drink",
          "description": "1oz Grey Goose or Patron Silver with choice of mix; add Red Bull +$2.50"
        },
        {
          "name": "Feature Sangria",
          "price": "$9.95",
          "category": "drink",
          "description": "6oz feature sangria"
        },
        {
          "name": "Tacos",
          "price": "$2.99",
          "category": "food",
          "description": "Artichoke, cauliflower, chicken tinga, carnitas, al pastor or beef"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "di-beppe-restaurant",
    "name": "Di Beppe Restaurant",
    "formatted_address": "8 W Cordova St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2823743,
        "lng": -123.10450569999999
      }
    },
    "formatted_phone_number": "(604) 559-1122",
    "website": "http://www.dibeppe.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.dibeppe.com/happy-hour-menu",
      "deals": [
        {
          "name": "Any bottle of wine",
          "price": "$15 off",
          "category": "drink",
          "description": "$15 off any bottle of wine during Aperitivo Hour"
        },
        {
          "name": "Cocktails",
          "price": "$12",
          "category": "drink",
          "description": "Aperol Spritz, Limoncello Spritz, Bellini Italaino, Americano, Bicicletta, Cynar Spritz, Negroni, Lambrusco Negroni"
        },
        {
          "name": "Vermouth",
          "price": "$4",
          "category": "drink",
          "description": "Cinzano Rosso; Martini Bianco or Dry"
        },
        {
          "name": "Vino della Casa",
          "price": "$8",
          "category": "drink",
          "description": "House wine — Rosso, Bianco or Rosato"
        },
        {
          "name": "Prosecco",
          "price": "$10",
          "category": "drink",
          "description": "Glass of prosecco"
        },
        {
          "name": "Birra alla spina",
          "price": "$8",
          "category": "drink",
          "description": "Draft beer"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "burgoo",
    "name": "Burgoo",
    "formatted_address": "3096 Main St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2576533,
        "lng": -123.10088750000001
      }
    },
    "formatted_phone_number": "(604) 873-1441",
    "website": "https://www.burgoo.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.burgoo.ca/food-drink-menu/",
      "deals": [
        {
          "name": "All Local Draught",
          "price": "$6",
          "category": "drink",
          "description": "12oz pour of any local draught beer"
        },
        {
          "name": "Bistro Wine",
          "price": "$6",
          "category": "drink",
          "description": "5oz glass of Bistro white or red"
        },
        {
          "name": "Premium Highballs",
          "price": "$6",
          "category": "drink",
          "description": "1oz happy hour premium highball; double shot +$3"
        },
        {
          "name": "Shooters with Boo",
          "price": "$6",
          "category": "drink",
          "description": "1oz shooter — Fireball, Limoncello or Sambuca"
        },
        {
          "name": "Sorbet Soda",
          "price": "$6",
          "category": "drink",
          "description": "1oz version of the vodka, soda, mint and mango sorbet cocktail"
        },
        {
          "name": "Street Legal Dealcoholized Pilsner",
          "price": "$6",
          "category": "drink",
          "description": "473ml can of non-alcoholic pilsner"
        },
        {
          "name": "Strawberry Lemonade",
          "price": "$6",
          "category": "drink",
          "description": "Their trademark macerated strawberry lemonade"
        },
        {
          "name": "Burgoo Burger + Brew",
          "price": "$25",
          "category": "food",
          "description": "The Burgoo Burger paired with a brew"
        },
        {
          "name": "Parmesan Fries",
          "price": "$11",
          "category": "food",
          "description": "Featured starter — buy 1 get 1 free; parmesan, parsley, pesto mayo"
        },
        {
          "name": "Hummus & Flatbread",
          "price": "$11",
          "category": "food",
          "description": "Featured starter — buy 1 get 1 free; garlicky chickpea purée, paprika, parsley, warm flatbread"
        },
        {
          "name": "Guacamole & Tortilla Chips",
          "price": "$11",
          "category": "food",
          "description": "Featured starter — buy 1 get 1 free; fresh avocado, pickled jalapeno, cilantro"
        },
        {
          "name": "Mini Mac + Cheese",
          "price": "$12",
          "category": "food",
          "description": "Featured starter — buy 1 get 1 free; first course version of the classic"
        },
        {
          "name": "Crispy Brussel Sprouts",
          "price": "$13",
          "category": "food",
          "description": "Featured starter — buy 1 get 1 free; balsamic drizzle, bacon, chives"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "skewers-souvlaki-pita-bar",
    "name": "Skewers Souvlaki Pita Bar",
    "formatted_address": "26 Powell St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2830875,
        "lng": -123.10352209999998
      }
    },
    "formatted_phone_number": "(604) 566-5257",
    "website": "https://skewersgastown.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://skewersgastown.ca/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "sopra-sotto-pizzeria",
    "name": "Sopra Sotto Pizzeria",
    "formatted_address": "1510 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2711635,
        "lng": -123.0693181
      }
    },
    "formatted_phone_number": "(604) 251-7586",
    "website": "http://www.soprasotto.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "16:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://soprasotto.ca/vancouver-menu",
      "deals": [
        {
          "name": "Sopra Sotto Lager",
          "price": "$6",
          "category": "drink",
          "description": ""
        },
        {
          "name": "House Wine",
          "price": "$8",
          "category": "drink",
          "description": ""
        },
        {
          "name": "Prosecco",
          "price": "$8",
          "category": "drink",
          "description": ""
        },
        {
          "name": "Aperol Spritz",
          "price": "$10",
          "category": "drink",
          "description": ""
        },
        {
          "name": "Negroni",
          "price": "$10",
          "category": "drink",
          "description": ""
        },
        {
          "name": "Mini Diavola Pizza Fritta",
          "price": "$10",
          "category": "food",
          "description": ""
        },
        {
          "name": "Mini Capricciosa Pizza Fritta",
          "price": "$10",
          "category": "food",
          "description": ""
        },
        {
          "name": "Arancini",
          "price": "$10",
          "category": "food",
          "description": "Tomato sauce, mozzarella, grana padano"
        },
        {
          "name": "Insalata Verde",
          "price": "$10",
          "category": "food",
          "description": "Seasonal greens, dijon shallot vinaigrette"
        },
        {
          "name": "Pizza Margherita",
          "price": "$16",
          "category": "food",
          "description": ""
        },
        {
          "name": "Spaghetti Cacio e Pepe",
          "price": "$18",
          "category": "food",
          "description": "Pecorino romano, black pepper"
        },
        {
          "name": "Calamari Fritti",
          "price": "$20",
          "category": "food",
          "description": ""
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "tableau-bar-bistro",
    "name": "Tableau Bar Bistro",
    "formatted_address": "1181 Melville St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.287562699999995,
        "lng": -123.1234599
      }
    },
    "formatted_phone_number": "(604) 639-8692",
    "website": "http://tableaubarbistro.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:30",
      "end": "17:30",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.tableaubarbistro.com/menu",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "nook-kitsilano",
    "name": "Nook Kitsilano",
    "formatted_address": "1525 Yew St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2722275,
        "lng": -123.15516619999998
      }
    },
    "formatted_phone_number": "(604) 734-0099",
    "website": "http://nookrestaurants.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://nookrestaurants.com/kitsilano-menus/",
      "deals": [
        {
          "name": "Focaccia",
          "price": "$7",
          "category": "food",
          "description": "oven baked, chili, rosemary, grana padano"
        },
        {
          "name": "Whipped Ricotta Crostini",
          "price": "$12",
          "category": "food",
          "description": "honey, toasted hazelnuts"
        },
        {
          "name": "Greens",
          "price": "$14",
          "category": "food",
          "description": "escarole, chickpeas, walnuts, onion, pecorino"
        },
        {
          "name": "Caesar",
          "price": "$14",
          "category": "food",
          "description": "classic dressing, romaine hearts, house-made croutons, pecorino crisps, grana padano"
        },
        {
          "name": "Tonnarelli Cacio e Pepe",
          "price": "$17",
          "category": "food",
          "description": "pecorino, grana padano, black pepper, arugula"
        },
        {
          "name": "Oven Roasted Meatballs",
          "price": "$17",
          "category": "food",
          "description": "pomodoro, grana padano"
        },
        {
          "name": "Margherita Pizza",
          "price": "$17",
          "category": "food",
          "description": "pomodoro, fior di latte, basil"
        },
        {
          "name": "Rigatoni Boscaiola",
          "price": "$19",
          "category": "food",
          "description": "mushrooms, prosciutto, onion, sundried tomatoes, cream, grana padano"
        },
        {
          "name": "Pepperoni Pizza",
          "price": "$19",
          "category": "food",
          "description": "ezzo pepperoni, pomodoro, parsley"
        },
        {
          "name": "Happy Hour for Two",
          "price": "$29",
          "category": "food",
          "description": "two 5oz glasses of Make Me Happy White, Rosé or Red plus one Margherita or Pepperoni pizza"
        },
        {
          "name": "Aperol Spritz",
          "price": "$12",
          "category": "drink",
          "description": "Aperol, Prosecco (5oz)"
        },
        {
          "name": "Negroni",
          "price": "$11",
          "category": "drink",
          "description": "Beefeater Gin, Campari, Cinzano (3oz)"
        },
        {
          "name": "Make Me Happy Prosecco",
          "price": "$8 / $39",
          "category": "drink",
          "description": "Italian prosecco, 5oz / 25oz"
        },
        {
          "name": "Make Me Happy White",
          "price": "$8 / $39",
          "category": "drink",
          "description": "Italian white wine, 5oz / 25oz"
        },
        {
          "name": "Make Me Happy Rosé",
          "price": "$8 / $39",
          "category": "drink",
          "description": "Italian rosé, 5oz / 25oz"
        },
        {
          "name": "Make Me Happy Red",
          "price": "$8 / $39",
          "category": "drink",
          "description": "Italian red wine, 5oz / 25oz"
        },
        {
          "name": "Four Winds Huftgold Pilsner",
          "price": "$6",
          "category": "drink",
          "description": "15oz draught"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-red-accordion",
    "name": "The Red Accordion",
    "formatted_address": "1616 Alberni St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2902311,
        "lng": -123.13179299999999
      }
    },
    "formatted_phone_number": "(604) 428-6464",
    "website": "http://theredaccordion.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://theredaccordion.com/",
      "deals": [
        {
          "name": "Chili Lime Nuts & Wasabi Peas",
          "price": "$9",
          "category": "food",
          "description": "Happy hour snack"
        },
        {
          "name": "Pesto Chicken Skewers",
          "price": "$12",
          "category": "food",
          "description": "Bell pepper pesto, toasted walnuts, mint oil"
        },
        {
          "name": "Wagyu Skewers",
          "price": "$14",
          "category": "food",
          "description": "Meli melo sauce, crispy shallots, cilantro"
        },
        {
          "name": "Edamame Hummus & Fried Dough",
          "price": "$13",
          "category": "food",
          "description": "Herb hummus, citrus, extra virgin olive oil, birds eye chillies"
        },
        {
          "name": "Braised Beef Poutine",
          "price": "$18",
          "category": "food",
          "description": "House cut fries, secret jus, cheese curds, truffle pecorino, red wine braised beef, pickled shallots, chives, pickled mustard seed"
        },
        {
          "name": "Ain't No Thang (chicken wings)",
          "price": "$22",
          "category": "food",
          "description": "Locally raised crispy chicken wings, birds eye chillies, fresh herbs, maple & tamari soy reduction"
        },
        {
          "name": "TRA Burger 2.0",
          "price": "$26",
          "category": "food",
          "description": "6 oz house ground AAA Alberta beef, house baked brioche, whisky onion jam, blue cheese or smoked cheddar, crispy shallots, arugula, garlic aioli, balsamic reduction, kennebec fries"
        },
        {
          "name": "Main Street Krush Crisp Lager",
          "price": "$6.50",
          "category": "drink",
          "description": "16 oz draft, 4.5% ABV | 16 IBU"
        },
        {
          "name": "Main Street Hula Hula Tropical Sour",
          "price": "$6.50",
          "category": "drink",
          "description": "16 oz draft, 5.4% ABV"
        },
        {
          "name": "Parkside Motel Hazy Pale Ale",
          "price": "$6.50",
          "category": "drink",
          "description": "16 oz draft, 5.8% ABV | 40 IBU"
        },
        {
          "name": "Vancouver Island West Coast Trail IPA",
          "price": "$6.50",
          "category": "drink",
          "description": "16 oz draft, 7% ABV | 80 IBU"
        },
        {
          "name": "Vancouver Island Sea Dog Amber Ale",
          "price": "$6.50",
          "category": "drink",
          "description": "16 oz draft, 5.2% ABV | 20 IBU"
        },
        {
          "name": "Garden of Granite Sauvignon Blanc",
          "price": "$7.50",
          "category": "drink",
          "description": "6 oz pour, North Vancouver, BC"
        },
        {
          "name": "Garden of Granite Cabernet Sauvignon",
          "price": "$7.50",
          "category": "drink",
          "description": "6 oz pour, North Vancouver, BC"
        },
        {
          "name": "Monte Creek Living Land Sparkling",
          "price": "$7.50",
          "category": "drink",
          "description": "6 oz pour, Kamloops, BC"
        },
        {
          "name": "Wine of the Week",
          "price": "$10",
          "category": "drink",
          "description": "6 oz pour, selection changes weekly"
        },
        {
          "name": "Negroni",
          "price": "$10",
          "category": "drink",
          "description": "2 oz; gin, Campari, sweet vermouth"
        },
        {
          "name": "Boulevardier",
          "price": "$10",
          "category": "drink",
          "description": "2 oz; whiskey/bourbon, Campari, sweet vermouth"
        },
        {
          "name": "Spanish G&T Copa",
          "price": "$10",
          "category": "drink",
          "description": "Beefeater London Dry Gin, tonic, mint, juniper berries & citrus"
        },
        {
          "name": "Lisboa Porto & Tonica",
          "price": "$10",
          "category": "drink",
          "description": "White port, tonic, fresh orange, mint"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "big-way-hot-pot-robson",
    "name": "Big Way Hot Pot (Robson)",
    "formatted_address": "778 Robson St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2816979,
        "lng": -123.1206403
      }
    },
    "formatted_phone_number": "(604) 569-1888",
    "website": "http://www.bigwayhotpot.com/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "11:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://www.bigwayhotpot.com/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "eat-bar-patio-haraheri",
    "name": "Eat Bar & Patio Haraheri",
    "formatted_address": "888 Nelson St m101, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2800364,
        "lng": -123.12527859999999
      }
    },
    "formatted_phone_number": "(604) 899-0855",
    "website": "https://haraheri.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "17:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://haraheri.ca/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "como-taperia",
    "name": "Como Taperia",
    "formatted_address": "201 E 7th Ave, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2647426,
        "lng": -123.10063310000001
      }
    },
    "formatted_phone_number": "(604) 879-3100",
    "website": "https://www.comotaperia.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "16:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.comotaperia.com/pages/menu",
      "deals": [
        {
          "name": "All Bottled Wine & Sherry",
          "price": "35% off",
          "category": "drink",
          "description": "35% off all bottled wine and sherry"
        },
        {
          "name": "Free Tapas",
          "price": "Free",
          "category": "food",
          "description": "At the bar only, with drink purchase"
        },
        {
          "name": "Food",
          "price": "25% off",
          "category": "food",
          "description": "25% off regular menu, except for the Raciones and Media sections"
        },
        {
          "name": "Select Wine",
          "price": "$12",
          "category": "drink",
          "description": "Select red or white wine"
        },
        {
          "name": "Select Cava",
          "price": "$12",
          "category": "drink",
          "description": "Select cava"
        },
        {
          "name": "Vermut De La Casa",
          "price": "$9",
          "category": "drink",
          "description": "House vermut, 3oz"
        },
        {
          "name": "Tio Pepe Fino Sherry",
          "price": "$9",
          "category": "drink",
          "description": "Tio Pepe Fino sherry, 3oz"
        },
        {
          "name": "Estrella",
          "price": "$7",
          "category": "drink",
          "description": "Estrella beer, 16oz"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "alouette-bistro",
    "name": "Alouette Bistro",
    "formatted_address": "567 Hornby St #1207, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2852733,
        "lng": -123.11816639999999
      }
    },
    "formatted_phone_number": "(604) 689-8862",
    "website": "http://alouettevancouver.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.alouettevancouver.com/menu",
      "deals": [
        {
          "name": "Moules et Frites",
          "price": "$14",
          "category": "food",
          "description": "fennel, leeks, shallots, tomato, white wine, saffron coconut cream, fries"
        },
        {
          "name": "Baked Brie",
          "price": "$14",
          "category": "food",
          "description": "walnut, bacon, maple syrup, baguette"
        },
        {
          "name": "Shrimp Provençal",
          "price": "$14",
          "category": "food",
          "description": "tomato, confit garlic, white wine, butter"
        },
        {
          "name": "Duck Poutine",
          "price": "$14",
          "category": "food",
          "description": "triple cooked fries, confit duck, duck gravy, cheese, herbs"
        },
        {
          "name": "Escargot",
          "price": "$14",
          "category": "food",
          "description": "garlic butter, toast"
        },
        {
          "name": "Olives",
          "price": "$10",
          "category": "food",
          "description": "house marinated blend, herbs"
        },
        {
          "name": "Truffle Fries",
          "price": "$10",
          "category": "food",
          "description": "triple blanched fries, truffle aioli"
        },
        {
          "name": "Wine 5oz / Beer 16oz",
          "price": "$6",
          "category": "drink",
          "description": "red, white, rose, sparkling wine, or beer"
        },
        {
          "name": "Rotating Happy Hour Cocktail",
          "price": "$9",
          "category": "drink",
          "description": "rotating featured cocktail, 2 oz"
        },
        {
          "name": "Premium Wine 5oz",
          "price": "$12",
          "category": "drink",
          "description": "red, white, rosé, or sparkling"
        },
        {
          "name": "Spritz It Up! 5oz",
          "price": "$12",
          "category": "drink",
          "description": "aperol or hugo; zero proof available"
        },
        {
          "name": "Martini Your Way 2oz",
          "price": "$12",
          "category": "drink",
          "description": "grey goose vodka or the botanist gin"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "tutto-italian-restaurant-bar",
    "name": "Tutto Italian Restaurant & Bar",
    "formatted_address": "901 Homer St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2784387,
        "lng": -123.1188587
      }
    },
    "formatted_phone_number": "(604) 900-2054",
    "website": "http://www.tuttorestaurant.ca/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5
      ],
      "start": "14:30",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://tuttorestaurant.ca/menus",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "carlino-restaurant",
    "name": "Carlino Restaurant",
    "formatted_address": "1115 Alberni St #3F, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2857158,
        "lng": -123.1240693
      }
    },
    "formatted_phone_number": "(604) 695-1115",
    "website": "http://www.carlinorestaurant.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:30",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.carlinorestaurant.com/menu",
      "deals": [
        {
          "name": "Sicilian Fried Olives",
          "price": "$6",
          "category": "food",
          "description": "Ricotta & herb, lemon aioli"
        },
        {
          "name": "Warm Crispy Potato Chips",
          "price": "$5",
          "category": "food",
          "description": "Cippolini onion dip"
        },
        {
          "name": "Crispy Polenta Fries",
          "price": "$7",
          "category": "food",
          "description": "Garlic aioli"
        },
        {
          "name": "Classic Arancini",
          "price": "$7",
          "category": "food",
          "description": "Aged cheese, tomato sugo"
        },
        {
          "name": "Mortadella Focaccia (3pc)",
          "price": "$12",
          "category": "food",
          "description": "Stracciatella, pistachio pesto"
        },
        {
          "name": "Chicken Milanese (2pc)",
          "price": "$11",
          "category": "food",
          "description": "Arugula, pecorino, lemon aioli"
        },
        {
          "name": "Parmigiano Chicken Wings (5pc)",
          "price": "$9",
          "category": "food",
          "description": "Calabrian chili, preserved lemon ranch dip"
        },
        {
          "name": "Veal Meatballs (3pc)",
          "price": "$7",
          "category": "food",
          "description": "Tomato sugo, pecorino"
        },
        {
          "name": "Pacific Blue Prawns (5pc)",
          "price": "$11",
          "category": "food",
          "description": "Garlic butter, chili, basil"
        },
        {
          "name": "Grilled Lamb Sausage (2pc)",
          "price": "$9",
          "category": "food",
          "description": "Peperonata, oregano oil"
        },
        {
          "name": "Prosciutto, Manchego & Tapenade",
          "price": "$18",
          "category": "food",
          "description": "House breadsticks"
        },
        {
          "name": "Chicken Liver Pâté",
          "price": "$12",
          "category": "food",
          "description": "Bruschetta, balsamic, chestnuts"
        },
        {
          "name": "Montasio Potato Cake (Frico)",
          "price": "$7",
          "category": "food",
          "description": "Slow onion"
        },
        {
          "name": "Oxtail Postage Stamp Ravioli (Francobolli)",
          "price": "$13",
          "category": "food",
          "description": "Brown butter pangrattato"
        },
        {
          "name": "Manzo Burger",
          "price": "$19",
          "category": "food",
          "description": "Prime rib beef, cheddar, bacon jam, arugula, tomato"
        },
        {
          "name": "Gingerino",
          "price": "$9",
          "category": "drink",
          "description": "Ginger-infused Aperol, Chardonnay, carbonated (regular menu $16)"
        },
        {
          "name": "Amore Amaro",
          "price": "$9",
          "category": "drink",
          "description": "Amaro del Capo, Nonino Amaro, cassis liqueur, carbonated white tea (regular menu $16)"
        },
        {
          "name": "Nuovo Sbagliato",
          "price": "$9",
          "category": "drink",
          "description": "Blend of vermouth, Campari, Lambrusco (regular menu $16)"
        },
        {
          "name": "Floravera",
          "price": "$9",
          "category": "drink",
          "description": "Gin, grapefruit, lemon, elderflower syrup, fresh dill"
        },
        {
          "name": "Campanella",
          "price": "$9",
          "category": "drink",
          "description": "Tequila, Aperol, hibiscus syrup, lime"
        },
        {
          "name": "Off the Record",
          "price": "$10",
          "category": "drink",
          "description": "Rye whiskey, rum, amaro, sweet vermouth, bitters"
        },
        {
          "name": "Hoyne North Star Light Lager",
          "price": "$8",
          "category": "drink",
          "description": "Draft/bottled beer"
        },
        {
          "name": "Peroni",
          "price": "$9",
          "category": "drink",
          "description": "Italian lager"
        },
        {
          "name": "Monzo Italian Pilsner",
          "price": "$8",
          "category": "drink",
          "description": "Italian pilsner"
        },
        {
          "name": "Hoyne Dark Matter",
          "price": "$8",
          "category": "drink",
          "description": "Dark ale"
        },
        {
          "name": "White Wine",
          "price": "$9",
          "category": "drink",
          "description": "Calliope Pinot Gris, Okanagan Valley"
        },
        {
          "name": "Red Wine",
          "price": "$9",
          "category": "drink",
          "description": "Umani Ronchi 'Medoro' Sangiovese, Italy"
        },
        {
          "name": "Chilled Red",
          "price": "$9",
          "category": "drink",
          "description": "Medici Ermete 'Bei Momenti' Reggiano Lambrusco, Italy"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "zoomak-korean-tavern",
    "name": "Zoomak Korean Tavern",
    "formatted_address": "52 Alexander St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2834565,
        "lng": -123.10295359999999
      }
    },
    "formatted_phone_number": "(604) 620-1240",
    "website": "http://zoomakyvr.com/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.zoomakyvr.com/drinks",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "novo-italian",
    "name": "Novo Italian",
    "formatted_address": "2118 Burrard St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2666203,
        "lng": -123.1454703
      }
    },
    "formatted_phone_number": "(604) 736-2220",
    "website": "http://www.novoitalian.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.novoitalian.com/happyhour",
      "deals": [
        {
          "name": "Mix Warm Olives",
          "price": "$8",
          "category": "food",
          "description": "Warm mixed marinated olives"
        },
        {
          "name": "House Truffle Fries",
          "price": "$8",
          "category": "food",
          "description": "Hand cut potatoes, truffle oil, parm and truffle aioli"
        },
        {
          "name": "House Foccacia",
          "price": "$7",
          "category": "food",
          "description": "Balsamic, olive oil and parm"
        },
        {
          "name": "Calamari Fritti",
          "price": "$14",
          "category": "food",
          "description": "Fried squid, marinated in buttermilk, pepperoncini with dill tartar"
        },
        {
          "name": "Caprese Salad",
          "price": "$12",
          "category": "food",
          "description": "Heirloom cherry tomatoes, mozzarella, basil, arugula, balsamic"
        },
        {
          "name": "Novo Caesar",
          "price": "$14",
          "category": "food",
          "description": "Romaine lettuce, caesar dressing, croutons and parm"
        },
        {
          "name": "Buttermilk Fried Chicken",
          "price": "$14",
          "category": "food",
          "description": "Fried chicken with honey chili glaze and basil aioli"
        },
        {
          "name": "Margherita Pizza",
          "price": "$18",
          "category": "food",
          "description": "Brick oven Neapolitan pizza"
        },
        {
          "name": "Americano Pizza",
          "price": "$20",
          "category": "food",
          "description": "Brick oven Neapolitan pizza"
        },
        {
          "name": "Prosciutto & Arugula Pizza",
          "price": "$24",
          "category": "food",
          "description": "Brick oven Neapolitan pizza"
        },
        {
          "name": "Spaghetti Pomodoro",
          "price": "$18",
          "category": "food",
          "description": "House made fresh pasta"
        },
        {
          "name": "Spaghetti Aglio e Olio",
          "price": "$16",
          "category": "food",
          "description": "House made fresh pasta"
        },
        {
          "name": "Meatballs",
          "price": "$5 each",
          "category": "food",
          "description": "Beef and veal meatballs"
        },
        {
          "name": "Local Draft",
          "price": "$6",
          "category": "drink",
          "description": "Local draft beer"
        },
        {
          "name": "Peroni Sleeve",
          "price": "$8",
          "category": "drink",
          "description": "Peroni draft sleeve"
        },
        {
          "name": "House Wine",
          "price": "$8",
          "category": "drink",
          "description": "Glass of house wine"
        },
        {
          "name": "Prosecco Mimosa",
          "price": "$8",
          "category": "drink",
          "description": "Prosecco mimosa"
        },
        {
          "name": "Aperol Spritz",
          "price": "$11",
          "category": "drink",
          "description": "Aperol, prosecco, soda"
        },
        {
          "name": "Negroni",
          "price": "$12",
          "category": "drink",
          "description": "Classic (gin, Campari, sweet vermouth), Sbagliato (Campari, sweet vermouth, prosecco), or Boulevardier (bourbon, Campari, sweet vermouth)"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "street-hawker-mount-pleasant",
    "name": "Street Hawker - Mount Pleasant",
    "formatted_address": "3088 Main St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.257717299999996,
        "lng": -123.1009855
      }
    },
    "formatted_phone_number": "(236) 427-2519",
    "website": "http://streethawker.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "http://streethawker.ca/",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "lavantine-restaurant-skybar",
    "name": "Lavantine Restaurant & Skybar",
    "formatted_address": "833 W Pender St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2857792,
        "lng": -123.1163804
      }
    },
    "formatted_phone_number": "(604) 416-2855",
    "website": "https://lavantine.ca/",
    "happy_hour": {
      "days": [
        0,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://lavantine.ca/wp-content/uploads/2026/06/Happy-Hour_Lavantine_May-2026.pdf",
      "deals": [
        {
          "name": "Draft Beer / House White or Red",
          "price": "$9",
          "category": "drink",
          "description": "Draft beer or house white or red wine"
        },
        {
          "name": "Desert Dreams",
          "price": "$10",
          "category": "drink",
          "description": "Cocktail: Roku Sakura, Esquimalt Dry, tropical wine"
        },
        {
          "name": "Rosewater Clear Margarita",
          "price": "$11",
          "category": "drink",
          "description": "Cocktail: Teramana Blanco, rosewater, citrus"
        },
        {
          "name": "Lavant White Negroni",
          "price": "$14",
          "category": "drink",
          "description": "Cocktail: Roku gin infused with pineapple, Bitter Bianco, Esquimalt Sweet. Add King ice $2"
        },
        {
          "name": "Minuty M Rose",
          "price": "$14",
          "category": "drink",
          "description": "Rose wine by the glass"
        },
        {
          "name": "Tantalus Pinot Gris or Burrowing Owl Merlot",
          "price": "$14",
          "category": "drink",
          "description": "Wine by the glass"
        },
        {
          "name": "Veuve Clicquot Brut",
          "price": "$18",
          "category": "drink",
          "description": "Champagne by the glass"
        },
        {
          "name": "Hummus",
          "price": "$12",
          "category": "food",
          "description": "Crispy chickpea, sumac, onion, olive oil, pita"
        },
        {
          "name": "Green Falafel",
          "price": "$12",
          "category": "food",
          "description": "Chickpea, parsley, cilantro, maple tahini"
        },
        {
          "name": "Babaganoush",
          "price": "$12",
          "category": "food",
          "description": "Smoked eggplant, pomegranate, walnut, pita"
        },
        {
          "name": "Chicken Wings",
          "price": "$14",
          "category": "food",
          "description": "Garlic labneh, chilli"
        },
        {
          "name": "Muhammara",
          "price": "$14",
          "category": "food",
          "description": "Walnut, red pepper, pomegranate molasses, pita"
        },
        {
          "name": "Fried Halloumi",
          "price": "$14",
          "category": "food",
          "description": "Zaatar, lemon, mango chutney"
        },
        {
          "name": "Truffle Fries",
          "price": "$15",
          "category": "food",
          "description": "Truffle, parmigiano"
        },
        {
          "name": "Lavantine Lamb Burger",
          "price": "$19",
          "category": "food",
          "description": "Dill, cucumber, red onion, baby gem, Kashkaval cheese, fries"
        },
        {
          "name": "Tuna Tartar",
          "price": "$21",
          "category": "food",
          "description": "Harissa aioli, togarashi, lemon labneh, pita"
        },
        {
          "name": "Mezze Selection",
          "price": "$32",
          "category": "food",
          "description": "Babaganoush, tzatziki, hummus, pita; add Muhammara or edamame hummus $7"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "nook-coal-harbour",
    "name": "Nook Coal Harbour",
    "formatted_address": "1155 Melville St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2874388,
        "lng": -123.1231932
      }
    },
    "formatted_phone_number": "(604) 606-1919",
    "website": "https://nookrestaurants.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://nookrestaurants.com/coal-harbour-menus-2/",
      "deals": [
        {
          "name": "Focaccia",
          "price": "$7",
          "category": "food",
          "description": "oven baked, chili, rosemary, grana padano"
        },
        {
          "name": "Ricotta Crostini",
          "price": "$12",
          "category": "food",
          "description": "honey, toasted hazelnuts"
        },
        {
          "name": "Greens",
          "price": "$14",
          "category": "food",
          "description": "romaine hearts, escarole, avocado dressing, quinoa, marcona almonds, macedonian feta"
        },
        {
          "name": "Caesar",
          "price": "$14",
          "category": "food",
          "description": "classic dressing, romaine hearts, sourdough croutons, pecorino crisps, grana padano"
        },
        {
          "name": "Tonnarelli Cacio e Pepe",
          "price": "$17",
          "category": "food",
          "description": "pecorino, grana padano, black pepper, arugula"
        },
        {
          "name": "Oven Roasted Meatballs",
          "price": "$17",
          "category": "food",
          "description": "pomodoro, grana padano"
        },
        {
          "name": "Margherita Pizza",
          "price": "$17",
          "category": "food",
          "description": "pomodoro, fior di latte, basil"
        },
        {
          "name": "Rigatoni Boscaiola",
          "price": "$19",
          "category": "food",
          "description": "mushrooms, prosciutto, onion, sun-dried tomatoes, cream, grana padano"
        },
        {
          "name": "Pepperoni Pizza",
          "price": "$19",
          "category": "food",
          "description": "ezzo pepperoni, pomodoro, parsley"
        },
        {
          "name": "Pizza & Vino For Two",
          "price": "$29",
          "category": "food",
          "description": "two 5oz glasses of Nook house White, Rosé or Red (IT) plus one Margherita or Pepperoni pizza"
        },
        {
          "name": "Aperol Spritz",
          "price": "$12",
          "category": "drink",
          "description": "Aperol, Prosecco (5oz)"
        },
        {
          "name": "Negroni",
          "price": "$11",
          "category": "drink",
          "description": "Beefeater Gin, Campari, Cinzano (3oz)"
        },
        {
          "name": "Nook house wine",
          "price": "$8 / $39",
          "category": "drink",
          "description": "Prosecco / White / Rosé / Red (IT), 5oz / 25oz"
        },
        {
          "name": "Four Winds Huftgold Pilsner",
          "price": "$6",
          "category": "drink",
          "description": "15oz draft"
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "b-house-restaurant",
    "name": "B House Restaurant",
    "formatted_address": "2270 Commercial Dr, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2644549,
        "lng": -123.0695255
      }
    },
    "formatted_phone_number": "(604) 564-2468",
    "website": "http://www.bhouse.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://bhouse.ca/menu",
      "deals": []
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-sequel-kitchen-bar",
    "name": "The Sequel - Kitchen & Bar",
    "formatted_address": "1575 W Georgia St, Vancouver, BC",
    "address_components": null,
    "geometry": {
      "location": {
        "lat": 49.2905367,
        "lng": -123.1299861
      }
    },
    "formatted_phone_number": "(604) 336-3036",
    "website": "https://thesequel.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "16:45",
      "verified": false,
      "verified_source": null,
      "source_url": "https://thesequel.ca/wp-content/uploads/2026/03/TheSequel-Menu-Mar2026-BarMenu-ForPrint.pdf",
      "deals": [
        {
          "name": "Fresh Oysters of the Moment",
          "price": "$3",
          "category": "food",
          "description": "Mignonette, fresh horseradish, lemon wedge. Minimum 6."
        },
        {
          "name": "Charcuterie to Share",
          "price": "$20",
          "category": "food",
          "description": "Selection of imported cheese and meats, fruits, house pickles and crostini."
        },
        {
          "name": "Honey Mussels",
          "price": "$25",
          "category": "food",
          "description": "Garlic white wine sauce, grape tomatoes, garlic bread."
        },
        {
          "name": "Steak Bites",
          "price": "$19",
          "category": "food",
          "description": "Deep fried house-marinated AAA beef on mixed greens with honey mustard sauce."
        },
        {
          "name": "Outback Ribeye Flatbread",
          "price": "$18",
          "category": "food",
          "description": "Marinated AAA beef, smoked tomato chutney, pickled red onion, mozzarella, horseradish aioli, naan bread."
        },
        {
          "name": "Spring Flatbread",
          "price": "$13",
          "category": "food",
          "description": "Arugula, grape tomatoes, pickled red onion, smoked tomato chutney, mozzarella, naan bread."
        },
        {
          "name": "Pork Belly Tacos",
          "price": "$16",
          "category": "food",
          "description": "House spiced pork belly, cabbage, pickled red onion, chipotle aioli, chimichurri."
        },
        {
          "name": "Gone With The Wings",
          "price": "$16",
          "category": "food",
          "description": "Choice of lemon pepper, hot, or mala seasoning."
        },
        {
          "name": "Bacon Jam",
          "price": "$15",
          "category": "food",
          "description": "Baked house made bacon jam topped with triple brie, crostini."
        },
        {
          "name": "Calamari Gaga",
          "price": "$16",
          "category": "food",
          "description": "Fresh sliced squid dipped in flour then fried, served with cucumber dip."
        },
        {
          "name": "Prawn Cocktail",
          "price": "$14",
          "category": "food",
          "description": "Six tiger prawns with cocktail sauce."
        },
        {
          "name": "Diamond Rings",
          "price": "$10",
          "category": "food",
          "description": "Crispy onion rings served with ranch dressing."
        },
        {
          "name": "Truffle Fries",
          "price": "$13",
          "category": "food",
          "description": "Crispy fries with truffle oil, fresh parmesan and parsley."
        },
        {
          "name": "Plant Based Chicken Tenders",
          "price": "$13",
          "category": "food",
          "description": "Breaded soy bean curd tenders, ranch or honey mustard sauce."
        },
        {
          "name": "Creamy Truffle Mushroom Gemelli",
          "price": "$24",
          "category": "food",
          "description": "Sauteed cremini and shimeji mushrooms, truffle mushroom cream sauce, Parmigiano Reggiano."
        },
        {
          "name": "Housemade Lasagna",
          "price": "$26",
          "category": "food",
          "description": "Housemade meat sauce and fresh herbs, mozzarella and Parmigiano Reggiano."
        },
        {
          "name": "Signature Mushroom Burger",
          "price": "$22",
          "category": "food",
          "description": "Hand-pressed 7oz Certified Angus beef patty, mushroom, caramelized onion, jalapeño aioli, mozzarella, served with fries."
        },
        {
          "name": "Signature Clam Chowder",
          "price": "$12",
          "category": "food",
          "description": "Baby clams, Yukon gold potatoes, bacon and tarragon. Daily limited."
        },
        {
          "name": "Feature Rotating Beer",
          "price": "$6",
          "category": "drink",
          "description": "Rotating tap feature (regularly $10)."
        },
        {
          "name": "Superflux 'Easy Tiger' Pale Ale",
          "price": "$6",
          "category": "drink",
          "description": "Draft pale ale, ABV 4.5%."
        },
        {
          "name": "Driftwood 'Fat Tug' IPA",
          "price": "$7",
          "category": "drink",
          "description": "Draft IPA, ABV 7% (regularly $11)."
        },
        {
          "name": "Cabanagroni",
          "price": "$9",
          "category": "drink",
          "description": "Toasted coconut & cherry infused Dillon's gin, Campari, sweet vermouth blend (regularly $18)."
        },
        {
          "name": "'Cucumber Castle' Old Fashioned",
          "price": "$9",
          "category": "drink",
          "description": "Bearface Triple Oak whiskey, Montenegro amaro, dry vermouth, black pepper tincture, cucumber (regularly $19)."
        },
        {
          "name": "'515' Espresso Martini",
          "price": "$8",
          "category": "drink",
          "description": "Dillon's rye vodka, cold brew infused rum liqueur, orange coffee oleo, espresso, Scrappy's lavender (regularly $19)."
        },
        {
          "name": "Larusso",
          "price": "$9",
          "category": "drink",
          "description": "Strawberry infused Tromba Blanco tequila, orange liqueur, white chocolate agave, lime (regularly $18)."
        },
        {
          "name": "Laddie's Ember Reverie",
          "price": "$18",
          "category": "drink",
          "description": "Bruichladdich The Laddie Classic, Campari, Patrón Silver, orange bitters (regularly $22)."
        },
        {
          "name": "Freixenet Cordon Negro Cava",
          "price": "$12",
          "category": "drink",
          "description": "5oz glass, Brut, Spain NV (regularly $15); bottle $53."
        },
        {
          "name": "Ogier Côtes du Ventoux Rosé",
          "price": "$13",
          "category": "drink",
          "description": "5oz glass, Rhône, France 2023 (regularly $15); bottle $54."
        },
        {
          "name": "Cantina Lavis Pinot Grigio",
          "price": "$13",
          "category": "drink",
          "description": "5oz glass, Trentino, Italy 2023 (regularly $16); bottle $54."
        },
        {
          "name": "Doña Paula Estate Malbec",
          "price": "$15",
          "category": "drink",
          "description": "5oz glass, Mendoza, Argentina 2023 (regularly $16); bottle $54."
        }
      ]
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "fanny-bay-oyster-bar",
    "name": "Fanny Bay Oyster Bar",
    "formatted_address": "762 Cambie Street, Vancouver, BC",
    "address_components": {
      "street_number": "762",
      "route": "Cambie Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6B 2P2",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.278575,
        "lng": -123.114112
      }
    },
    "formatted_phone_number": "+1-778-379-9510",
    "website": "https://www.fannybayoysters.com/location/oyster-bar--shellfish-market",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "14:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.fannybayoysters.com/uploads/pdf/2026summermenumaster.pdf",
      "deals": [
        {
          "name": "Featured Oysters",
          "price": "$2 ea",
          "category": "food",
          "description": "Served with lemon, horseradish, mignonette (GF)"
        },
        {
          "name": "Premium Featured Oysters",
          "price": "$2.75 ea",
          "category": "food",
          "description": "Served with lemon, horseradish, mignonette (GF)"
        },
        {
          "name": "Truffle Fries",
          "price": "$12",
          "category": "food",
          "description": "Kennebec fries, truffle oil, Parmesan, chives, aioli"
        },
        {
          "name": "Fish Tacos",
          "price": "$18",
          "category": "food",
          "description": "2pc marinated & grilled fish tacos, guacamole, taco sauce, pico de gallo (GF)"
        },
        {
          "name": "Sablefish Collars",
          "price": "$19",
          "category": "food",
          "description": "3pc soy marinated fried collars, Korean BBQ glaze, cilantro, sesame"
        },
        {
          "name": "Snapper Ceviche",
          "price": "$19",
          "category": "food",
          "description": "Avocado, sweet potato, leche de tigre, chilli, tortilla chips (GF)"
        },
        {
          "name": "Tuna Tartare",
          "price": "$21",
          "category": "food",
          "description": "BC Albacore, Asian pear, avocado mayo, ginger citrus vinaigrette, trout roe, wonton chips"
        },
        {
          "name": "Smoked Oyster Dip",
          "price": "$21",
          "category": "food",
          "description": "Ekone smoked oysters, crispy shallots, chives, Ritz crackers"
        },
        {
          "name": "Mussels & Clams",
          "price": "$25",
          "category": "food",
          "description": "Mixed or solo in your choice of white wine & herbs or miso cream broth (GF)"
        },
        {
          "name": "Lobster Roll",
          "price": "$30",
          "category": "food",
          "description": "Chilled Atlantic lobster, celery, Asian pear, scallion, wasabi aioli, milk bun"
        },
        {
          "name": "Lobster Poutine",
          "price": "$30",
          "category": "food",
          "description": "Atlantic lobster, lobster bisque gravy, fries, cheese curds, chives"
        },
        {
          "name": "Fanny Bay Oyster Shooter",
          "price": "$9",
          "category": "drink",
          "description": "1oz Forty Creek Rye, house made Clamato Caesar mix, fresh oyster"
        },
        {
          "name": "Draft Beer",
          "price": "$7/14oz",
          "category": "drink",
          "description": "Phillips Tilt Lager or Blue Buck Pale Ale"
        },
        {
          "name": "House Wines",
          "price": "$11/6oz",
          "category": "drink",
          "description": "Sauvignon Blanc / Rose / Merlot - Open Estate, Okanagan, BC; $40 per bottle"
        },
        {
          "name": "Premium Wine",
          "price": "$13/6oz",
          "category": "drink",
          "description": "Chardonnay - Kettle Valley, Okanagan, BC; $43 per bottle"
        },
        {
          "name": "House Sparkling",
          "price": "$12/6oz",
          "category": "drink",
          "description": "Rose Prosecco - Serena, Veneto, IT; $42 per bottle"
        },
        {
          "name": "Champagne",
          "price": "$25/6oz",
          "category": "drink",
          "description": "Duval-Leroy Brut NV - Cotes de Blanc, FR; $100 per bottle"
        },
        {
          "name": "Sparkling Sake",
          "price": "$35/300ml btl",
          "category": "drink",
          "description": "Rotating sparkling sake - Japan"
        },
        {
          "name": "Non-Alc Beer Cans",
          "price": "$7",
          "category": "drink",
          "description": "Zero proof - Phillips Brewing Iota Pilsner or Hazy IPA"
        }
      ]
    },
    "osm": {
      "type": "node",
      "id": 4842937821,
      "amenity": "restaurant"
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "hydra-estiatorio-mediterranean",
    "name": "Hydra Estiatorio Mediterranean",
    "formatted_address": "475 Howe Street, Vancouver, BC",
    "address_components": {
      "street_number": "475",
      "route": "Howe Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6C 2B3",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.2857071,
        "lng": -123.1161599
      }
    },
    "formatted_phone_number": "+1-604-416-0880",
    "website": "https://www.hydravancouver.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.hydravancouver.com/menu",
      "deals": []
    },
    "osm": {
      "type": "node",
      "id": 6927768691,
      "amenity": "restaurant"
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "pourhouse",
    "name": "Pourhouse",
    "formatted_address": "162 Water Street, Vancouver, BC",
    "address_components": {
      "street_number": "162",
      "route": "Water Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6B 1B2",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.2841314,
        "lng": -123.1083829
      }
    },
    "formatted_phone_number": "+1-604-568-7022",
    "website": "https://www.pourhousevancouver.com/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.pourhousevancouver.com/menu/happy-hour",
      "deals": [
        {
          "name": "Select Red",
          "price": "$10",
          "category": "drink",
          "description": "Select red wine"
        },
        {
          "name": "Select White",
          "price": "$10",
          "category": "drink",
          "description": "Select white wine"
        },
        {
          "name": "Select Rose",
          "price": "$10",
          "category": "drink",
          "description": "Select rose wine"
        },
        {
          "name": "Draught Beer",
          "price": "$6/$9",
          "category": "drink",
          "description": "10oz / 16oz draught beer"
        },
        {
          "name": "Classics Volume 1",
          "price": "$2 off",
          "category": "drink",
          "description": "$2 off cocktails from the Classics Volume 1 list"
        },
        {
          "name": "Smash Burger",
          "price": "$10",
          "category": "food",
          "description": "brisket & chuck, american cheese, caramelized onion, pickle, shredduce, secret sauce"
        },
        {
          "name": "Smashroom Burger",
          "price": "$10",
          "category": "food",
          "description": "mushroom patty, american cheese, caramelized onion, pickle, shredduce, secret sauce (V)"
        },
        {
          "name": "Chips & Dip",
          "price": "$7",
          "category": "food",
          "description": "sour cream, caramelized onion, chive (GF/V)"
        },
        {
          "name": "Truffle Tots",
          "price": "$12",
          "category": "food",
          "description": "tater tots, truffle salsa, grana padano (V/GF)"
        },
        {
          "name": "Scotch Egg",
          "price": "$13",
          "category": "food",
          "description": "fennel sausage, soft boiled egg, panko, spicy mayo"
        },
        {
          "name": "Meatballs",
          "price": "$11",
          "category": "food",
          "description": "beef, pork & veal, marinara, chives"
        }
      ]
    },
    "osm": {
      "type": "node",
      "id": 4390232892,
      "amenity": "pub"
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "greta-yvr",
    "name": "Greta YVR",
    "formatted_address": "50 West Cordova Street, Vancouver, BC",
    "address_components": {
      "street_number": "50",
      "route": "West Cordova Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6B 1C9",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.2826091,
        "lng": -123.105799
      }
    },
    "formatted_phone_number": "+1-604-423-3081",
    "website": "https://www.gretabar.com/locations/vancouver",
    "happy_hour": {
      "days": [
        2,
        3,
        4,
        5,
        6
      ],
      "start": "16:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://gretabar.com/vancouver/food-menu/",
      "deals": [
        {
          "name": "Handcrafted cocktails",
          "price": "$12.00",
          "category": "drink",
          "description": "Handcrafted cocktails from the Vancouver cocktail list"
        },
        {
          "name": "Casamigos Blanco",
          "price": "$10.00",
          "category": "drink",
          "description": "Casamigos Blanco tequila"
        },
        {
          "name": "GRETA House Draft",
          "price": "$7.00",
          "category": "drink",
          "description": "16.5oz house draft"
        },
        {
          "name": "Highballs & Shafts",
          "price": "$7.00",
          "category": "drink",
          "description": "1oz highballs and Shafts"
        },
        {
          "name": "House Wine",
          "price": "$7.00",
          "category": "drink",
          "description": "6oz pour of house wine"
        },
        {
          "name": "El Tequileño",
          "price": "$7.00",
          "category": "drink",
          "description": "1oz El Tequileño tequila"
        },
        {
          "name": "Finnish Long Drink",
          "price": "$7.00",
          "category": "drink",
          "description": "Finnish Long Drink RTD"
        },
        {
          "name": "Red Bull",
          "price": "$5.00",
          "category": "drink",
          "description": "Red Bull energy drink"
        },
        {
          "name": "Street Nuggets",
          "price": "$12.00",
          "category": "food",
          "description": "Buttermilk chicken nuggets, pickles, choice of sauce"
        },
        {
          "name": "GRETA Nachos",
          "price": "$10.00",
          "category": "food",
          "description": "Corn chips, nacho beans, feta, chipotle sauce, guacamole, pico, lime crema, jalapeños"
        },
        {
          "name": "Roasted Kale Caesar Salad",
          "price": "$8.00",
          "category": "food",
          "description": "Caesar dressing, gremolata crumb, grana padano"
        },
        {
          "name": "Big Mac Fries",
          "price": "$7.50",
          "category": "food",
          "description": "Fresh-cut fries, Wagyu, cheddar, fancy sauce, onion, pickles"
        },
        {
          "name": "GRETA Burger Sliders",
          "price": "$6.00",
          "category": "food",
          "description": "Wagyu burger sliders"
        },
        {
          "name": "Pork Belly Bao",
          "price": "$5.00",
          "category": "food",
          "description": "Maple soy glaze, cabbage, soy pickles, green onion"
        }
      ]
    },
    "osm": {
      "type": "node",
      "id": 6437608536,
      "amenity": "bar"
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "six-acres",
    "name": "Six Acres",
    "formatted_address": "203 Carrall Street, Vancouver, BC",
    "address_components": {
      "street_number": "203",
      "route": "Carrall Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6B 2J2",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.2833658,
        "lng": -123.1044261
      }
    },
    "formatted_phone_number": "+1-604-488-0110",
    "website": "https://www.sixacres.ca/",
    "happy_hour": {
      "days": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.sixacres.ca/happy-hour",
      "deals": [
        {
          "name": "Crispy Chicken Burger",
          "price": "$16",
          "category": "food",
          "description": "Buttermilk marinated fried chicken, crispy romaine, tomato and pickles, spicy mayo on brioche bun, served with house fries"
        },
        {
          "name": "Parmesan Fries",
          "price": "$8",
          "category": "food",
          "description": "Crispy chips tossed in Grana Padano and fresh parsley served with garlic aioli; add truffle oil +2 (GF/V)"
        },
        {
          "name": "Chili Lime Prawns",
          "price": "$12",
          "category": "food",
          "description": "Pan fried prawns in white wine, garlic, lime, chili butter and Grana Padano"
        },
        {
          "name": "Beef Stew",
          "price": "$12",
          "category": "food",
          "description": "AAA Alberta beef with russet potatoes, carrots and celery in a hunter sauce, served with baguette"
        },
        {
          "name": "Yuzu Calamari",
          "price": "$12",
          "category": "food",
          "description": "Crispy squid, jalapeno, cucumber and tzatziki"
        },
        {
          "name": "Chicken Tenders",
          "price": "$14",
          "category": "food",
          "description": "Served with fries and honey mustard dipping sauce"
        },
        {
          "name": "The Peanut Butter Cup",
          "price": "$12",
          "category": "drink",
          "description": "Screwball peanut butter whiskey, Kahlua, Baileys, espresso; 2oz cocktail (regularly $18)"
        },
        {
          "name": "Margarita",
          "price": "$12",
          "category": "drink",
          "description": "Choose your margarita: lime / guava / spicy mango; 2oz cocktail (regularly $17)"
        },
        {
          "name": "Old Fashioned",
          "price": "$12",
          "category": "drink",
          "description": "Whisky, sugar, Angostura; 2oz cocktail"
        },
        {
          "name": "6A Sangria",
          "price": "$13",
          "category": "drink",
          "description": "Red wine, brandy, orange, seasonal fruit; 2oz (regularly $18)"
        },
        {
          "name": "Six Acres Lager",
          "price": "$7",
          "category": "drink",
          "description": "16oz, BC (regularly $9)"
        },
        {
          "name": "Six Acres Pale Ale",
          "price": "$7",
          "category": "drink",
          "description": "16oz, BC (regularly $9)"
        },
        {
          "name": "House Red Wine",
          "price": "$7",
          "category": "drink",
          "description": "5oz, BC (regularly $10)"
        },
        {
          "name": "House White Wine",
          "price": "$7",
          "category": "drink",
          "description": "5oz, BC (regularly $10)"
        },
        {
          "name": "House Highballs",
          "price": "$7",
          "category": "drink",
          "description": "1oz"
        }
      ]
    },
    "osm": {
      "type": "node",
      "id": 4859979322,
      "amenity": "pub"
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-boxcar",
    "name": "The Boxcar",
    "formatted_address": "917 Main Street, Vancouver, BC",
    "address_components": {
      "street_number": "917",
      "route": "Main Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6A 2V8",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.2765849,
        "lng": -123.1001156
      }
    },
    "formatted_phone_number": "+1-604-239-7109",
    "website": "https://www.boxcarvancouver.com",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "16:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.boxcarvancouver.com/pizza-menu",
      "deals": [
        {
          "name": "Slice & beer combo",
          "price": "$10",
          "category": "food",
          "description": "Happy hour pizza party: one slice of Mortadella Pizzeria Roma-style pizza plus a beer"
        }
      ]
    },
    "osm": {
      "type": "node",
      "id": 12164513044,
      "amenity": "bar"
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "brix-mortar",
    "name": "Brix & Mortar",
    "formatted_address": "1138 Homer Street, Vancouver, BC",
    "address_components": {
      "street_number": "1138",
      "route": "Homer Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6B 2X6",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.2756856,
        "lng": -123.1220661
      }
    },
    "formatted_phone_number": null,
    "website": "https://www.brixandmortar.ca",
    "happy_hour": {
      "days": [
        0,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "16:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.brixandmortar.ca/happy-hour/",
      "deals": [
        {
          "name": "Buttermilk Fried Heritage Chicken",
          "price": "$15",
          "category": "food",
          "description": "Torn herbs, spiced honey butter, chili aioli, pickled chilies"
        },
        {
          "name": "Grilled Sourdough Bread",
          "price": "$9",
          "category": "food",
          "description": "Charred green onion butter"
        },
        {
          "name": "Warmed Olives",
          "price": "$10",
          "category": "food",
          "description": "Calabrian chili & lemon, whipped ricotta cheese"
        },
        {
          "name": "Blackened Tiger Prawns",
          "price": "$15",
          "category": "food",
          "description": "Remoulade, baby greens, curled onions"
        },
        {
          "name": "Spiced French Fries",
          "price": "$10",
          "category": "food",
          "description": "Lemon garlic aioli"
        },
        {
          "name": "Fresh Mussels",
          "price": "$19",
          "category": "food",
          "description": "Nduja butter sauce, cherry tomato, fresh herbs"
        },
        {
          "name": "Fried Cauliflower Bites",
          "price": "$11",
          "category": "food",
          "description": "Hannah Brook Farm cauliflower, house buffalo sauce"
        },
        {
          "name": "Burger & a Bevvie",
          "price": "$25",
          "category": "food",
          "description": "Hand ground 8oz Wagyu & Canada Prime beef patty, pickled beet BBQ mayo, tallow braised local onions & aged cheddar on a Martin's Famous potato roll, plus a pint of draught beer or 5oz happy hour wine"
        },
        {
          "name": "2oz Cocktails",
          "price": "$8",
          "category": "drink",
          "description": "Happy hour 2oz cocktails — Vodka Mule, double bar rail highballs. Page lists this as both $8 and $10"
        },
        {
          "name": "'Canadian' Old Fashioned",
          "price": "$12",
          "category": "drink",
          "description": "Bearface Triple Oak Rye Whiskey, signature turbinado syrup, orange twist, maraschino cherry, king cube"
        },
        {
          "name": "Lazy Layover",
          "price": "$11",
          "category": "drink",
          "description": "Coconut Cartel Rum, grapefruit, cinnamon, coconut water"
        },
        {
          "name": "Spicy Margarita",
          "price": "$11",
          "category": "drink",
          "description": "Jalapeño infused Nodo Tequila, Cointreau, fresh lime, agave, Tajin rim"
        },
        {
          "name": "Rosé Sangria",
          "price": "$11",
          "category": "drink",
          "description": "St Remy Brandy, raspberry rosé syrup, guava juice"
        },
        {
          "name": "Craft Draught Beer 18oz",
          "price": "$6",
          "category": "drink",
          "description": "OK 1516 Spring Lager, Superflux 'Happyness' IPA, Slow Hand Pale Ale, rotating tap"
        },
        {
          "name": "Wine 5oz",
          "price": "$7",
          "category": "drink",
          "description": "Sandhill Estate Pinot Gris 2022 (Okanagan, BC), Bodega Olivares Rosado 2021 (Jumilla, Spain), Pata Negra Toro 2020 (Spain)"
        },
        {
          "name": "Bottles of wine $140 & under",
          "price": "30% off",
          "category": "drink",
          "description": "All bottles of wine priced $140 and under are 30% off during happy hour"
        }
      ]
    },
    "osm": {
      "type": "node",
      "id": 3932735573,
      "amenity": "restaurant"
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "joe-fortes",
    "name": "Joe Fortes",
    "formatted_address": "777 Thurlow Street, Vancouver, BC",
    "address_components": {
      "street_number": "777",
      "route": "Thurlow Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6E 1V8",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.2849273,
        "lng": -123.124611
      }
    },
    "formatted_phone_number": "+1-604-669-1940",
    "website": "https://www.joefortes.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "15:00",
      "end": "17:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://www.joefortes.ca/menus/",
      "deals": []
    },
    "osm": {
      "type": "node",
      "id": 3690929433,
      "amenity": "restaurant"
    },
    "last_synced_at": "2026-08-30"
  },
  {
    "place_id": null,
    "international_phone_number": null,
    "types": [
      "restaurant",
      "bar",
      "food",
      "point_of_interest",
      "establishment"
    ],
    "business_status": "OPERATIONAL",
    "price_level": null,
    "rating": null,
    "user_ratings_total": null,
    "opening_hours": {
      "weekday_text": []
    },
    "photos": [],
    "amenities": {
      "outdoor_seating": null,
      "gluten_free_options": null,
      "wheelchair_accessible_entrance": null,
      "parking": null,
      "transit": null
    },
    "data_source": "discovery",
    "id": "the-515-bar",
    "name": "The 515 Bar",
    "formatted_address": "521 Seymour Street, Vancouver, BC",
    "address_components": {
      "street_number": "521",
      "route": "Seymour Street",
      "locality": "Vancouver",
      "administrative_area_level_1": "BC",
      "postal_code": "V6B 1W7",
      "country": "CA"
    },
    "geometry": {
      "location": {
        "lat": 49.283841,
        "lng": -123.1143806
      }
    },
    "formatted_phone_number": null,
    "website": "https://the515bar.ca/",
    "happy_hour": {
      "days": [
        0,
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "start": "17:00",
      "end": "18:00",
      "verified": false,
      "verified_source": null,
      "source_url": "https://the515bar.ca/",
      "deals": [
        {
          "name": "Jefferson County",
          "price": "$10",
          "category": "drink",
          "description": "2oz — Tanqueray Gin, Lillet, St. Germain, lemon, sparkling wine, orange bitters"
        },
        {
          "name": "Negroni",
          "price": "$10",
          "category": "drink",
          "description": "3oz — Tanqueray Gin, Campari, Cinzano"
        },
        {
          "name": "Martini",
          "price": "$10",
          "category": "drink",
          "description": "2oz — Tanqueray Gin, Noilly Prat, orange bitters"
        },
        {
          "name": "Daiquiri",
          "price": "$10",
          "category": "drink",
          "description": "2oz — Havana Club 3 Year, Wray & Nephew, lime, turbinado"
        },
        {
          "name": "Wine by the glass",
          "price": "$10",
          "category": "drink",
          "description": "White, red or rosé by the glass"
        },
        {
          "name": "Local draft beer",
          "price": "$6",
          "category": "drink",
          "description": "All local draft"
        },
        {
          "name": "Charred Edamame",
          "price": "$6",
          "category": "food",
          "description": "Edamame, Tajin"
        }
      ]
    },
    "osm": {
      "type": "node",
      "id": 11079577905,
      "amenity": "bar"
    },
    "last_synced_at": "2026-08-30"
  }
];

const VENUES_PLACES = {
  "homer-st-cafe-and-bar": {
    "place_id": "ChIJG_9jCH5xhlQRtcDS3SP5k_U",
    "rating": 4.4,
    "user_ratings_total": 2414,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Homer St. Cafe and Bar",
    "synced_at": "2026-08-30"
  },
  "ancora": {
    "place_id": "ChIJrVQM-NFzhlQR5039qtBEmXE",
    "rating": 4.3,
    "user_ratings_total": 1402,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Ancora Waterfront Dining and Patio",
    "synced_at": "2026-08-30"
  },
  "earls-test-kitchen": {
    "place_id": "ChIJDe-U4n9xhlQRHe5feMqgXwM",
    "rating": 4.7,
    "user_ratings_total": 10435,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Earls Kitchen + Bar",
    "synced_at": "2026-08-30"
  },
  "hapa-izakaya-yaletown": {
    "place_id": "ChIJW8fi6NZzhlQRjKvR2NBsVkc",
    "rating": 4.4,
    "user_ratings_total": 1133,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Hapa Izakaya Yaletown",
    "synced_at": "2026-08-30"
  },
  "boulevard-kitchen-oyster-bar": {
    "place_id": "ChIJxwQPG4BxhlQRtCIXIfvmh9I",
    "rating": 4.5,
    "user_ratings_total": 1667,
    "price_level": 4,
    "business_status": "OPERATIONAL",
    "matched_name": "Boulevard Kitchen & Oyster Bar",
    "synced_at": "2026-08-30"
  },
  "glowbal": {
    "place_id": "ChIJ184e4X5xhlQREgkeHvFAYwE",
    "rating": 4.6,
    "user_ratings_total": 10417,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Glowbal",
    "synced_at": "2026-08-30"
  },
  "havana": {
    "place_id": "ChIJz-KODz9xhlQRtVWCFPnJBpY",
    "rating": 4.3,
    "user_ratings_total": 3611,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Havana Vancouver",
    "synced_at": "2026-08-30"
  },
  "brewhall": {
    "place_id": "ChIJoSErr2FxhlQRM-J1vP3DBqM",
    "rating": 4.3,
    "user_ratings_total": 1446,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "BREWHALL",
    "synced_at": "2026-08-30"
  },
  "chambar": {
    "place_id": "ChIJq2tI6HtxhlQRBaKUv59cS9E",
    "rating": 4.5,
    "user_ratings_total": 4439,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Chambar Restaurant",
    "synced_at": "2026-08-30"
  },
  "d6-bar-lounge": {
    "place_id": "ChIJfU6-5ulzhlQRzXMfFayzzqU",
    "rating": 4.2,
    "user_ratings_total": 753,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "D/6 Bar & Lounge",
    "synced_at": "2026-08-30"
  },
  "central-restaurants-vancouver-bentall": {
    "place_id": "ChIJ72Q27rRxhlQRFYeILV_DARk",
    "rating": 4.7,
    "user_ratings_total": 1050,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Central Restaurants - Vancouver Bentall",
    "synced_at": "2026-08-30"
  },
  "tap-barrel-convention-centre": {
    "place_id": "ChIJ4WVPWYNxhlQRX1ZjV-bu69o",
    "rating": 4.2,
    "user_ratings_total": 3129,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Tap & Barrel • Convention Centre",
    "synced_at": "2026-08-30"
  },
  "p2b-restaurant-bar": {
    "place_id": "ChIJV5_58YNxhlQRAY6qECXa8vI",
    "rating": 4.5,
    "user_ratings_total": 979,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "P2B Restaurant + Bar",
    "synced_at": "2026-08-30"
  },
  "relish-the-pub": {
    "place_id": "ChIJvzgBQNVzhlQRFmLq5fcuTH4",
    "rating": 4.2,
    "user_ratings_total": 1227,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Relish The Pub",
    "synced_at": "2026-08-30"
  },
  "french-creek-pub-vancouver": {
    "place_id": "ChIJ8VZC-uhzhlQRBKQHQaxgyxg",
    "rating": 4.7,
    "user_ratings_total": 15,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "French Creek Pub",
    "synced_at": "2026-08-30"
  },
  "zubu-ramen-downtown": {
    "place_id": "ChIJu_L5cudxhlQRfMprQBqWBJU",
    "rating": 4.3,
    "user_ratings_total": 682,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "ZUBU Ramen - Downtown",
    "synced_at": "2026-08-30"
  },
  "1931-gallery-bistro": {
    "place_id": "ChIJH4ScrwVxhlQRk74FDsvybDE",
    "rating": 4,
    "user_ratings_total": 438,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "1931 Gallery Bistro",
    "synced_at": "2026-08-30"
  },
  "notch8-restaurant-bar": {
    "place_id": "ChIJg_-i0YFxhlQRIF9uO3r3DmM",
    "rating": 4.1,
    "user_ratings_total": 1558,
    "price_level": 4,
    "business_status": "OPERATIONAL",
    "matched_name": "Notch8 Restaurant & Bar",
    "synced_at": "2026-08-30"
  },
  "parker-rooftop": {
    "place_id": "ChIJozcsADtzhlQRyZU-sYUvk6w",
    "rating": 4.2,
    "user_ratings_total": 642,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Parker Rooftop",
    "synced_at": "2026-08-30"
  },
  "hawksworth-restaurant": {
    "place_id": "ChIJSQDA8oZ0hlQR_IFn3VHeS4w",
    "rating": 4.3,
    "user_ratings_total": 2074,
    "price_level": 4,
    "business_status": "OPERATIONAL",
    "matched_name": "Hawksworth Restaurant",
    "synced_at": "2026-08-30"
  },
  "banter-room": {
    "place_id": "ChIJy9N3R9ZzhlQRhcyU8dkLAmU",
    "rating": 4,
    "user_ratings_total": 1360,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Banter Room",
    "synced_at": "2026-08-30"
  },
  "el-guapo-mexican-restaurant": {
    "place_id": "ChIJH2bzVGtzhlQRs1Ok98zdwLQ",
    "rating": 4.1,
    "user_ratings_total": 773,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "El Guapo - Mexican Restaurant Vancouver",
    "synced_at": "2026-08-30"
  },
  "tacofino-taco-bar-yaletown": {
    "place_id": "ChIJAQDwP9ZzhlQRSFSw-o6-Wck",
    "rating": 4.2,
    "user_ratings_total": 1997,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Tacofino Yaletown",
    "synced_at": "2026-08-30"
  },
  "the-parlour": {
    "place_id": "ChIJgQVLE9ZzhlQR1RvvVMTM9HM",
    "rating": 4.2,
    "user_ratings_total": 2307,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Parlour",
    "synced_at": "2026-08-30"
  },
  "the-flying-pig-yaletown": {
    "place_id": "ChIJR-oj79ZzhlQRPxQ0DJ-fZRI",
    "rating": 4.3,
    "user_ratings_total": 2761,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Flying Pig Yaletown",
    "synced_at": "2026-08-30"
  },
  "the-keg-steakhouse-bar-yaletown": {
    "place_id": "ChIJq69lPtZzhlQROZR50xKXYQw",
    "rating": 4.4,
    "user_ratings_total": 3177,
    "price_level": 3,
    "business_status": "OPERATIONAL",
    "matched_name": "The Keg Steakhouse + Bar - Yaletown",
    "synced_at": "2026-08-30"
  },
  "earls-yaletown": {
    "place_id": "ChIJ84uJWdZzhlQRW_JFwEYZIgY",
    "rating": 4.6,
    "user_ratings_total": 8395,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Earls Kitchen + Bar",
    "synced_at": "2026-08-30"
  },
  "moltaqa-moroccan-restaurant": {
    "place_id": "ChIJnbZ_HnpxhlQRYtAR6udPH4g",
    "rating": 4.3,
    "user_ratings_total": 2335,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Moltaqa Moroccan Restaurant",
    "synced_at": "2026-08-30"
  },
  "alchemy-bar-kitchen": {
    "place_id": "ChIJv-486r1zhlQRCUE79RGXqm8",
    "rating": 4.6,
    "user_ratings_total": 472,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Alchemy Bar and Kitchen",
    "synced_at": "2026-08-30"
  },
  "yaletown-brewing-company": {
    "place_id": "ChIJefmz9dZzhlQRCnVoCGiuGYs",
    "rating": 4,
    "user_ratings_total": 1523,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Yaletown Brewing Company",
    "synced_at": "2026-08-30"
  },
  "fanny-bay-oyster-bar": {
    "place_id": "ChIJW1pAMXxxhlQRNjNjIzra2fA",
    "rating": 4.5,
    "user_ratings_total": 3716,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Fanny Bay Oyster Bar & Shellfish Market",
    "synced_at": "2026-08-30"
  },
  "hydra-estiatorio-mediterranean": {
    "place_id": "ChIJP9IvbIJxhlQRMbVReWghV0E",
    "rating": 4.4,
    "user_ratings_total": 1604,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Hydra Estiatorio",
    "synced_at": "2026-08-30"
  },
  "pourhouse": {
    "place_id": "ChIJB3AAznlxhlQRnidXy4IF-TU",
    "rating": 4.4,
    "user_ratings_total": 1674,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Pourhouse Restaurant",
    "synced_at": "2026-08-30"
  },
  "greta-yvr": {
    "place_id": "ChIJzekgeeJxhlQR2X_6Wx4q8Io",
    "rating": 4.3,
    "user_ratings_total": 1432,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "GRETA Bar YVR",
    "synced_at": "2026-08-30"
  },
  "six-acres": {
    "place_id": "ChIJTRHlTndxhlQRNl_jlsUsokI",
    "rating": 4.3,
    "user_ratings_total": 1498,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Six Acres",
    "synced_at": "2026-08-30"
  },
  "the-boxcar": {
    "place_id": "ChIJyQtsDmVxhlQRELLh4j99wLA",
    "rating": 4.7,
    "user_ratings_total": 561,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "The Boxcar",
    "synced_at": "2026-08-30"
  },
  "brix-mortar": {
    "place_id": "ChIJl9xLjNZzhlQR7-ndY8Asql8",
    "rating": 4.4,
    "user_ratings_total": 1819,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Brix and Mortar",
    "synced_at": "2026-08-30"
  },
  "joe-fortes": {
    "place_id": "ChIJiUwIWIBxhlQRzKG3k_9C-T8",
    "rating": 4.5,
    "user_ratings_total": 8801,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Joe Fortes Seafood & Chop House",
    "synced_at": "2026-08-30"
  },
  "the-515-bar": {
    "place_id": "ChIJ7YoURvJxhlQRzNjtcdoRHcU",
    "rating": 4.8,
    "user_ratings_total": 379,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The 515 Bar",
    "synced_at": "2026-08-30"
  },
  "the-cambie-bar-grill": {
    "place_id": "ChIJwdi9uXlxhlQRe6VP8Uv-PJc",
    "rating": 4.1,
    "user_ratings_total": 3901,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "The Cambie Bar & Grill",
    "synced_at": "2026-08-30"
  },
  "cactus-club-cafe": {
    "place_id": "ChIJLwP4IIJxhlQRN41rdASKST0",
    "rating": 4.4,
    "user_ratings_total": 3628,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Cactus Club Cafe",
    "synced_at": "2026-08-30"
  },
  "marcello-ristorante-pizzeria": {
    "place_id": "ChIJlTlzTz9xhlQRUBS5dn6ARoM",
    "rating": 4.3,
    "user_ratings_total": 3596,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Marcello Ristorante & Pizzeria",
    "synced_at": "2026-08-30"
  },
  "mangos-kitchen-bar": {
    "place_id": "ChIJZ3g3Z9RzhlQRAwBHOA1-EpU",
    "rating": 4.3,
    "user_ratings_total": 2971,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Mangos Kitchen Bar",
    "synced_at": "2026-08-30"
  },
  "st-augustine-s": {
    "place_id": "ChIJAasqz0hxhlQRU3dfsfnfkoU",
    "rating": 4.1,
    "user_ratings_total": 2867,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "St. Augustine's",
    "synced_at": "2026-08-30"
  },
  "cactus-club-cafe-2": {
    "place_id": "ChIJTazswtZzhlQRuZas9GX26-I",
    "rating": 4.3,
    "user_ratings_total": 2745,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Cactus Club Cafe",
    "synced_at": "2026-08-30"
  },
  "malone-s-taphouse": {
    "place_id": "ChIJ78Kt7HhxhlQRC9LwX4-Fw98",
    "rating": 4.1,
    "user_ratings_total": 2659,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "Malone's Taphouse",
    "synced_at": "2026-08-30"
  },
  "la-mezcaleria": {
    "place_id": "ChIJEa-sXUdxhlQR8WFhlViz2Pk",
    "rating": 4.4,
    "user_ratings_total": 2632,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "La Mezcaleria",
    "synced_at": "2026-08-30"
  },
  "cactus-club-cafe-3": {
    "place_id": "ChIJhz9CFt1zhlQRpJSOgRKv9CA",
    "rating": 4.3,
    "user_ratings_total": 2455,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Cactus Club Cafe",
    "synced_at": "2026-08-30"
  },
  "sing-sing-main-st": {
    "place_id": "ChIJjdQkkShzhlQR5OKSMOYEgJI",
    "rating": 4.3,
    "user_ratings_total": 1925,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Sing Sing Main St",
    "synced_at": "2026-08-30"
  },
  "jamjar-canteen-commercial-dr": {
    "place_id": "ChIJUbWrKLFxhlQRPB1nQaTyZtA",
    "rating": 4.3,
    "user_ratings_total": 1793,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "Jamjar Canteen Commercial Dr.",
    "synced_at": "2026-08-30"
  },
  "bimini-s-since-1975": {
    "place_id": "ChIJLbIl1LVzhlQRVgj6XXfyU8o",
    "rating": 4.2,
    "user_ratings_total": 1497,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Bimini's Since 1975",
    "synced_at": "2026-08-30"
  },
  "between-2-buns-burgers": {
    "place_id": "ChIJKRxR6UdxhlQR6jMMAACAi58",
    "rating": 4.5,
    "user_ratings_total": 1474,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Between 2 Buns Burgers",
    "synced_at": "2026-08-30"
  },
  "the-butcher-bullock-public-house": {
    "place_id": "ChIJc6oZR4JxhlQRRoI_dkj6Jko",
    "rating": 4.1,
    "user_ratings_total": 1459,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Butcher & Bullock Public House",
    "synced_at": "2026-08-30"
  },
  "carlos-o-bryan-s-neighborhood-pub": {
    "place_id": "ChIJ57qrv7dzhlQRRuI062Hll2o",
    "rating": 4.2,
    "user_ratings_total": 1350,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Carlos O'Bryan's Neighborhood Pub",
    "synced_at": "2026-08-30"
  },
  "the-charlatan": {
    "place_id": "ChIJ0z_tUz9xhlQRX7t01nVfqL4",
    "rating": 4.1,
    "user_ratings_total": 1299,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Charlatan",
    "synced_at": "2026-08-30"
  },
  "opus-vancouver": {
    "place_id": "ChIJkYNgwtZzhlQRDyKMepVlARQ",
    "rating": 4.7,
    "user_ratings_total": 1256,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "OPUS Vancouver",
    "synced_at": "2026-08-30"
  },
  "memphis-blues-barbeque-house": {
    "place_id": "ChIJ60gnQT9xhlQR4sDTSLpiHwM",
    "rating": 4.2,
    "user_ratings_total": 1214,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Memphis Blues Barbeque House",
    "synced_at": "2026-08-30"
  },
  "caff-cittadella": {
    "place_id": "ChIJ1dHk_txzhlQREPMrE5srBLM",
    "rating": 4.1,
    "user_ratings_total": 1068,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Caffè Cittadella",
    "synced_at": "2026-08-30"
  },
  "fiorino-italian-street-food-chinatown-vancouver": {
    "place_id": "ChIJ8SWsS3FxhlQRYMDiAo7i7vo",
    "rating": 4.5,
    "user_ratings_total": 995,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Fiorino, Italian Street Food Chinatown Vancouver",
    "synced_at": "2026-08-30"
  },
  "bombay-kitchen-and-bar-denman-st": {
    "place_id": "ChIJSbmhiuRzhlQR04kvchr9X_I",
    "rating": 4.6,
    "user_ratings_total": 978,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Bombay Kitchen and Bar - Denman St",
    "synced_at": "2026-08-30"
  },
  "livia-forno-e-vino": {
    "place_id": "ChIJD7OS67pxhlQR99jnRuImeFo",
    "rating": 4.4,
    "user_ratings_total": 956,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "LIVIA Forno e Vino",
    "synced_at": "2026-08-30"
  },
  "forecast-coffee-main-street": {
    "place_id": "ChIJsfgDqXtzhlQROoYf0PVhqPw",
    "rating": 4.3,
    "user_ratings_total": 954,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Forecast Coffee - Main Street",
    "synced_at": "2026-08-30"
  },
  "noah-s-cafe": {
    "place_id": "ChIJOU68-ztzhlQRg30p3Cl_XoI",
    "rating": 4.7,
    "user_ratings_total": 840,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Noah's Cafe",
    "synced_at": "2026-08-30"
  },
  "bartholomew": {
    "place_id": "ChIJNZfIdq9zhlQRyOD5DmncCX8",
    "rating": 4.5,
    "user_ratings_total": 813,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Bartholomew",
    "synced_at": "2026-08-30"
  },
  "bayside-lounge-english-bay": {
    "place_id": "ChIJj6ywSi9yhlQRes3cKZTYNRw",
    "rating": 4.3,
    "user_ratings_total": 797,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Bayside Lounge — English Bay",
    "synced_at": "2026-08-30"
  },
  "the-cider-house": {
    "place_id": "ChIJAYnd32tzhlQR2Vso_pfwYiQ",
    "rating": 4.6,
    "user_ratings_total": 735,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Cider House",
    "synced_at": "2026-08-30"
  },
  "bar-corso": {
    "place_id": "ChIJNWm91udxhlQRv_cFcXKSgDk",
    "rating": 4.6,
    "user_ratings_total": 708,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Bar Corso",
    "synced_at": "2026-08-30"
  },
  "song-by-kin-kao": {
    "place_id": "ChIJS4OuFN5xhlQRDjKjnzsRfaY",
    "rating": 4.4,
    "user_ratings_total": 664,
    "price_level": 3,
    "business_status": "OPERATIONAL",
    "matched_name": "Song (by Kin Kao)",
    "synced_at": "2026-08-30"
  },
  "main-street-brewing-co": {
    "place_id": "ChIJVRfsn19xhlQRz8RcxJPGDPU",
    "rating": 4.4,
    "user_ratings_total": 566,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Main Street Brewing Co.",
    "synced_at": "2026-08-30"
  },
  "switch": {
    "place_id": "ChIJy6iEKrFxhlQRxXmvPtidAdg",
    "rating": 3.7,
    "user_ratings_total": 520,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "SWITCH",
    "synced_at": "2026-08-30"
  },
  "uncle-abe-s": {
    "place_id": "ChIJs6ZIdONzhlQR2rsnThDtbAI",
    "rating": 4.3,
    "user_ratings_total": 448,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "Uncle Abe's",
    "synced_at": "2026-08-30"
  },
  "the-watson": {
    "place_id": "ChIJr6-OKxtzhlQRpqNS4iSd4B0",
    "rating": 4.6,
    "user_ratings_total": 427,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Watson",
    "synced_at": "2026-08-30"
  },
  "junction": {
    "place_id": "ChIJnwAUXStyhlQRSqCQXVD1lZM",
    "rating": 3.7,
    "user_ratings_total": 411,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "Junction",
    "synced_at": "2026-08-30"
  },
  "mum-s-the-word": {
    "place_id": "ChIJxe8B78BxhlQRI_z8-jTPG0M",
    "rating": 4.5,
    "user_ratings_total": 347,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "Mum's The Word",
    "synced_at": "2026-08-30"
  },
  "the-old-spaghetti-factory-gastown": {
    "place_id": "ChIJEwXWQndxhlQRRKy4phazLq0",
    "rating": 4.4,
    "user_ratings_total": 9907,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Old Spaghetti Factory (Gastown)",
    "synced_at": "2026-08-30"
  },
  "dae-bak-bon-ga": {
    "place_id": "ChIJU5anOIdxhlQRzh_jCzdGJ_8",
    "rating": 4.6,
    "user_ratings_total": 5694,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Dae Bak Bon Ga",
    "synced_at": "2026-08-30"
  },
  "the-sandbar-seafood-restaurant": {
    "place_id": "ChIJj6Jmb85zhlQR8ho06uTUy6U",
    "rating": 4.5,
    "user_ratings_total": 5247,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "The Sandbar Seafood Restaurant",
    "synced_at": "2026-08-30"
  },
  "minami": {
    "place_id": "ChIJ9xLK-dZzhlQRIghtObN7n-A",
    "rating": 4.5,
    "user_ratings_total": 3931,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Minami",
    "synced_at": "2026-08-30"
  },
  "top-of-vancouver-revolving-restaurant": {
    "place_id": "ChIJfe2sYHhxhlQRYY79aUl69vw",
    "rating": 4.1,
    "user_ratings_total": 3511,
    "price_level": 4,
    "business_status": "OPERATIONAL",
    "matched_name": "Top Of Vancouver Revolving Restaurant",
    "synced_at": "2026-08-30"
  },
  "the-vancouver-fish-company": {
    "place_id": "ChIJr34m8M5zhlQRn3iyiebMMtI",
    "rating": 4.3,
    "user_ratings_total": 3208,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Vancouver Fish Company",
    "synced_at": "2026-08-30"
  },
  "gotham-steakhouse-cocktail-bar": {
    "place_id": "ChIJVQQVMn9xhlQRfFSHaGDN_EY",
    "rating": 4.6,
    "user_ratings_total": 3180,
    "price_level": 4,
    "business_status": "OPERATIONAL",
    "matched_name": "Gotham Steakhouse & Cocktail Bar",
    "synced_at": "2026-08-30"
  },
  "sylvia-hotel-restaurant-and-lounge": {
    "place_id": "ChIJTZVOoN1zhlQRSMNq0C_JoIo",
    "rating": 4.3,
    "user_ratings_total": 2350,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Sylvia Hotel, Restaurant and Lounge",
    "synced_at": "2026-08-30"
  },
  "the-pawn-shop-yvr-taco-bar": {
    "place_id": "ChIJM_-yTtRzhlQRwNVRKfJH3Gc",
    "rating": 4.5,
    "user_ratings_total": 2065,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "The Pawn Shop YVR Taco Bar",
    "synced_at": "2026-08-30"
  },
  "di-beppe-restaurant": {
    "place_id": "ChIJdUiOqXBxhlQR9xz4YULOF10",
    "rating": 4.4,
    "user_ratings_total": 1991,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Di Beppe Restaurant",
    "synced_at": "2026-08-30"
  },
  "burgoo": {
    "place_id": "ChIJPddQZeNzhlQRVbraHJJvZog",
    "rating": 4.4,
    "user_ratings_total": 1989,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Burgoo",
    "synced_at": "2026-08-30"
  },
  "skewers-souvlaki-pita-bar": {
    "place_id": "ChIJ9eGJ9fVxhlQRDbLkgdEI9Co",
    "rating": 4.8,
    "user_ratings_total": 1861,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Skewers Souvlaki Pita Bar",
    "synced_at": "2026-08-30"
  },
  "sopra-sotto-pizzeria": {
    "place_id": "ChIJqyN6rDhxhlQRqg9-Y5l1Zaw",
    "rating": 4.3,
    "user_ratings_total": 1825,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Sopra Sotto Pizzeria",
    "synced_at": "2026-08-30"
  },
  "tableau-bar-bistro": {
    "place_id": "ChIJ3XfeToFxhlQRDtyvLtryFyQ",
    "rating": 4.5,
    "user_ratings_total": 1808,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Tableau Bar Bistro",
    "synced_at": "2026-08-30"
  },
  "nook-kitsilano": {
    "place_id": "ChIJq9PfzEpyhlQRUqp026zudho",
    "rating": 4.5,
    "user_ratings_total": 1504,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Nook Kitsilano",
    "synced_at": "2026-08-30"
  },
  "the-red-accordion": {
    "place_id": "ChIJVSOOhhxxhlQRhMw5pYnZh_s",
    "rating": 4.6,
    "user_ratings_total": 1452,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Red Accordion",
    "synced_at": "2026-08-30"
  },
  "big-way-hot-pot-robson": {
    "place_id": "ChIJBbLiSzRxhlQRBrD-zZ0xUh4",
    "rating": 4.3,
    "user_ratings_total": 1424,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Big Way Hot Pot (Robson)",
    "synced_at": "2026-08-30"
  },
  "eat-bar-patio-haraheri": {
    "place_id": "ChIJda43-9FzhlQR8bDraTrZvXo",
    "rating": 4.3,
    "user_ratings_total": 1302,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Eat Bar & Patio Haraheri",
    "synced_at": "2026-08-30"
  },
  "como-taperia": {
    "place_id": "ChIJQ5f_MMBxhlQR9R17HcWGvUA",
    "rating": 4.3,
    "user_ratings_total": 1277,
    "price_level": 3,
    "business_status": "OPERATIONAL",
    "matched_name": "Como Taperia",
    "synced_at": "2026-08-30"
  },
  "alouette-bistro": {
    "place_id": "ChIJQ3EWTtpxhlQR8AOWxpM5tBY",
    "rating": 4.4,
    "user_ratings_total": 1150,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Alouette Bistro",
    "synced_at": "2026-08-30"
  },
  "tutto-italian-restaurant-bar": {
    "place_id": "ChIJk5D8YERxhlQRbJ_4S2KU7c0",
    "rating": 4.4,
    "user_ratings_total": 1068,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Tutto Italian Restaurant & Bar",
    "synced_at": "2026-08-30"
  },
  "carlino-restaurant": {
    "place_id": "ChIJw2Vqfk9xhlQRgGkg_E2xXmk",
    "rating": 4.3,
    "user_ratings_total": 1027,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Carlino Restaurant",
    "synced_at": "2026-08-30"
  },
  "zoomak-korean-tavern": {
    "place_id": "ChIJh04xmItxhlQRRdfJbkB4TR0",
    "rating": 4.5,
    "user_ratings_total": 868,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Zoomak Korean Tavern",
    "synced_at": "2026-08-30"
  },
  "novo-italian": {
    "place_id": "ChIJGUqN0rdzhlQRKgnl-CofZDk",
    "rating": 4.3,
    "user_ratings_total": 863,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Novo Italian",
    "synced_at": "2026-08-30"
  },
  "street-hawker-mount-pleasant": {
    "place_id": "ChIJPf80-rJzhlQRZrb4QC-ts9c",
    "rating": 4.4,
    "user_ratings_total": 818,
    "price_level": 1,
    "business_status": "OPERATIONAL",
    "matched_name": "Street Hawker - Mount Pleasant",
    "synced_at": "2026-08-30"
  },
  "lavantine-restaurant-skybar": {
    "place_id": "ChIJM8nta4JxhlQRcvV0ea22GUk",
    "rating": 4.5,
    "user_ratings_total": 747,
    "price_level": null,
    "business_status": "OPERATIONAL",
    "matched_name": "Lavantine Restaurant & Skybar",
    "synced_at": "2026-08-30"
  },
  "nook-coal-harbour": {
    "place_id": "ChIJ79MWkpxxhlQRvkJLkRIt0yU",
    "rating": 4.6,
    "user_ratings_total": 745,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "Nook Coal Harbour",
    "synced_at": "2026-08-30"
  },
  "b-house-restaurant": {
    "place_id": "ChIJzZFcYSdxhlQRBEix0Q2qvxg",
    "rating": 4.7,
    "user_ratings_total": 652,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "B House Restaurant",
    "synced_at": "2026-08-30"
  },
  "the-sequel-kitchen-bar": {
    "place_id": "ChIJnQawNoZxhlQRLqL59RyTo7U",
    "rating": 4.7,
    "user_ratings_total": 651,
    "price_level": 2,
    "business_status": "OPERATIONAL",
    "matched_name": "The Sequel - Kitchen & Bar",
    "synced_at": "2026-08-30"
  }
};
