// GENERATED FILE — do not edit by hand. Regenerate with: node pipeline/writeback.js
//
// Machine-written data layer merged over the hand-verified seed at app seed
// time (see sampleVenues() in app.js):
// - VENUES_EXTRACTED: per-venue deal lists read from each venue's own
//   official menu, applied ONLY where the automated read reproduced the
//   hand-verified schedule exactly (corroboration). Source page credited
//   per venue. The verified happy_hour schedule itself is never changed here.
// - VENUES_DISCOVERED: venues found by pipeline/discover.js, verified: false
//   until a human checks them.
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

const VENUES_DISCOVERED = [];
