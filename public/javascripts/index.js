var tags = [
    "Sun, Water, Lake...",
    "Window, Chair, Door...",
    "Horse, Child, Animal...",
    "Computer, Desk, Book...",
    "Face, Black Hair, Scarf...",
    "Shoe, Shirt, Pants...",
    "Forest, Trees, Nature...",
    "Car, Road, Highway...",
    "Cat, Run, Mouse...",
    "Beach, Vacation, Outdoor..."
]

var searchbox = new Typed('.tagbox', {
    strings: tags,
    typeSpeed: 60,
    backSpeed: 25,
    shuffle: true,
    attr: 'placeholder',
    bindInputFocusEvents: false,
    loop: true
  });
