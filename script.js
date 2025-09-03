let cart = [];
const cartBtn = document.getElementById("cart-btn");
const cartCount = document.getElementById("cart-count");
const cartDiv = document.getElementById("cart");
const cartItems = document.getElementById("cart-items");

function addToCart(product) {
  cart.push(product);
  updateCart();
}

function updateCart() {
  cartCount.textContent = cart.length;
  cartItems.innerHTML = "";
  cart.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = item + " ";
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.onclick = () => removeFromCart(index);
    li.appendChild(removeBtn);
    cartItems.appendChild(li);
  });
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

function clearCart() {
  cart = [];
  updateCart();
}

cartBtn.addEventListener("click", () => {
  cartDiv.classList.toggle("hidden");
});
