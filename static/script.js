// ==========================================
// 1. Firebase Configuration & Initialization
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyA-q4wanQxFdY37sopYSDqTCetJRWhCvWE",
    authDomain: "kashef-7d7b1.firebaseapp.com",
    databaseURL: "https://kashef-7d7b1-default-rtdb.firebaseio.com",
    projectId: "kashef-7d7b1",
    storageBucket: "kashef-7d7b1.firebasestorage.app",
    messagingSenderId: "440870120852",
    appId: "1:440870120852:web:14c6d98f5867acad8bb381",
    measurementId: "G-FNZDMDBQ1E"
};

// تهيئة الفايربيس باستخدام النسخة المتوافقة (Compat)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const rtdb = firebase.database(); // استخدام Realtime Database

let currentUser = null;
let priceChartInstance = null;

// ==========================================
// 2. UI & Navigation Logic
// ==========================================
function showPage(id) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(id + "-page").classList.add("active");
    window.scrollTo(0,0);
}

function toggleLoading(show) {
    document.getElementById("loader").style.display = show ? "flex" : "none";
}

// ==========================================
// 3. Search & Products Logic (RTDB Integration)
// ==========================================
async function performSearch() {
    const query = document.getElementById("search-input").value.trim().toLowerCase();
    const productList = document.getElementById("product-list");

    if (!query) {
        Swal.fire('Note', 'Please enter a product name.', 'info');
        return;
    }

    toggleLoading(true);
    productList.innerHTML = "";

    try {
        // جلب البيانات من Realtime Database من مسار products
        const snapshot = await rtdb.ref("products").once("value");
        const products = snapshot.val();
        let found = false;

        if (products) {
            Object.keys(products).forEach(key => {
                const product = products[key];

                // البحث باستخدام الحقل title بناءً على بياناتكم الحقيقية
                if (product.title && product.title.toLowerCase().includes(query)) {
                    found = true;
                    productList.innerHTML += `
                    <div class="team-card">
                        <h3 style="font-size: 1.1rem; margin-bottom: 10px;">${product.title}</h3>
                        <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin: 0;">${product.price} SAR</p>
                        <p style="color: #6b7280; font-size: 0.9rem;">Store: <strong>${product.source}</strong></p>
                        <div class="card-actions">
                            <a href="${product.link}" target="_blank" class="action-btn btn-store"><i class="fa-solid fa-cart-shopping"></i> View Store</a>
                            <button onclick="showPriceHistory('${product.title.replace(/'/g, "\\'")}')" class="action-btn btn-history"><i class="fa-solid fa-chart-line"></i> Price History</button>
                            <button onclick="addToWatchlist('${product.title.replace(/'/g, "\\'")}', ${product.price})" class="action-btn" style="background:var(--primary); color:white;"><i class="fa-solid fa-heart"></i> Add to Watchlist</button>
                        </div>
                    </div>`;
                }
            });
        }

        if (!found) {
            productList.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fa-solid fa-box-open"></i>
                <p>No products found for "<strong>${query}</strong>".</p>
            </div>`;
        }

        if (currentUser) await addToHistory(query);
        showPage("results");

    } catch (error) {
        console.error("Search Error:", error);
        Swal.fire('Error', 'Failed to fetch data from Realtime Database.', 'error');
    } finally {
        toggleLoading(false);
    }
}

// ==========================================
// 4. Authentication Logic
// ==========================================
auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
        document.getElementById("welcome-text").innerText = `Welcome back!`;
        loadHistory();
        loadWatchlist();
    }
});

function checkAuthStatus() {
    if(currentUser) showPage('dashboard');
    else showPage('login');
}

async function handleLogin(e) {
    e.preventDefault();
    toggleLoading(true);
    try {
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-pass").value;
        await auth.signInWithEmailAndPassword(email, pass);
        Swal.fire('Success', 'Logged in successfully!', 'success');
        showPage('dashboard');
    } catch (err) {
        Swal.fire('Login Error', err.message, 'error');
    } finally {
        toggleLoading(false);
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    toggleLoading(true);
    try {
        const email = document.getElementById("signup-email").value;
        const pass = document.getElementById("signup-pass").value;
        await auth.createUserWithEmailAndPassword(email, pass);
        Swal.fire('Success', 'Account created successfully!', 'success');
        showPage('dashboard');
    } catch (err) {
        Swal.fire('Signup Error', err.message, 'error');
    } finally {
        toggleLoading(false);
    }
}

async function logout() {
    await auth.signOut();
    Swal.fire('Logged out', 'You have been logged out.', 'info');
    showPage('home');
}

async function forgotPassword() {
    const email = document.getElementById("login-email").value;
    if(!email) {
        Swal.fire('Note', 'Please enter your email first.', 'warning');
        return;
    }
    try {
        await auth.sendPasswordResetEmail(email);
        Swal.fire('Sent!', 'Password reset link sent to your email.', 'success');
    } catch(err) {
        Swal.fire('Error', err.message, 'error');
    }
}

// ==========================================
// 5. Dashboard Logic (History & Watchlist)
// ==========================================
async function addToHistory(term) {
    if(!currentUser) return;
    await rtdb.ref("users/" + currentUser.uid + "/history").push({
        term,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
}

async function loadHistory() {
    if(!currentUser) return;
    const ref = rtdb.ref("users/" + currentUser.uid + "/history").limitToLast(6);
    ref.once("value", snapshot => {
        const box = document.getElementById("search-history");
        box.innerHTML = "";
        const data = snapshot.val();
        if (!data) {
            box.innerHTML = "<p>No recent searches.</p>";
            return;
        }
        Object.keys(data).reverse().forEach(key => {
            box.innerHTML += `<span class="history-item" onclick="document.getElementById('search-input').value='${data[key].term}'; performSearch();"><i class="fa fa-history"></i> ${data[key].term}</span>`;
        });
    });
}

async function clearHistory() {
    if(!currentUser) return;
    try {
        await rtdb.ref("users/" + currentUser.uid + "/history").remove();
        document.getElementById("search-history").innerHTML = "<p>History cleared.</p>";
        Swal.fire('Cleared', 'Your search history has been cleared.', 'success');
    } catch(err) { console.error(err); }
}

async function addToWatchlist(title, price) {
    if(!currentUser) {
        Swal.fire({
            title: 'Login Required',
            text: 'Please login to add items to your watchlist.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Go to Login'
        }).then((result) => { if (result.isConfirmed) showPage('login'); });
        return;
    }
    try {
        await rtdb.ref("users/" + currentUser.uid + "/watchlist").push({
            title: title,
            price: price,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        Swal.fire('Added!', 'Product added to your watchlist.', 'success');
        loadWatchlist();
    } catch(err) { Swal.fire('Error', err.message, 'error'); }
}

async function loadWatchlist() {
    if(!currentUser) return;
    rtdb.ref("users/" + currentUser.uid + "/watchlist").on("value", snapshot => {
        const box = document.getElementById("watchlist");
        box.innerHTML = "";
        const data = snapshot.val();
        if(!data) {
            box.innerHTML = "<p>Your watchlist is empty.</p>";
            return;
        }
        Object.keys(data).forEach(key => {
            const item = data[key];
            box.innerHTML += `
            <div class="wish-item">
                <div style="flex:1;">
                    <strong style="display:block; margin-bottom:5px;">${item.title}</strong>
                    <span style="color:var(--primary); font-weight:bold;">${item.price} SAR</span>
                </div>
                <button onclick="removeFromWatchlist('${key}')" style="background:none; border:none; color:#ef4444; font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-trash-can"></i></button>
            </div>`;
        });
    });
}

async function removeFromWatchlist(key) {
    try {
        await rtdb.ref("users/" + currentUser.uid + "/watchlist/" + key).remove();
    } catch(err) { console.error(err); }
}

// ==========================================
// 6. Chart Logic
// ==========================================
function showPriceHistory(name) {
    document.getElementById('history-modal').style.display = 'flex';
    document.getElementById('modal-product-title').innerText = "Price History: " + name;

    const ctx = document.getElementById('priceChart').getContext('2d');
    if (priceChartInstance) priceChartInstance.destroy();

    priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr'],
            datasets: [{
                label: 'Price in SAR',
                data: [3500, 3400, 3450, 3300],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.3
            }]
        }
    });
}

function closeModal() {
    document.getElementById('history-modal').style.display = 'none';
}

async function performSearch() {
    const query = document.getElementById("search-input").value.trim().toLowerCase();
    const productList = document.getElementById("product-list");

    if (!query) {
        Swal.fire('Note', 'Please enter a product name.', 'info');
        return;
    }

    toggleLoading(true);
    productList.innerHTML = "";

    try {
        // 1. جلب بيانات أمازون ونون في نفس الوقت
        const [amazonSnap, noonSnap] = await Promise.all([
            rtdb.ref("amazon-products").once("value"),
            rtdb.ref("noon-products").once("value")
        ]);

        const amazonData = amazonSnap.val() || {};
        const noonData = noonSnap.val() || {};

        // 2. دمج البيانات في مصفوفة واحدة
        const allProducts = [
            ...Object.values(amazonData),
            ...Object.values(noonData)
        ];

        console.log("Total products loaded:", allProducts.length);

        let found = false;

        // 3. البحث في كل المنتجات المدمجة
        allProducts.forEach(product => {
            // البحث في العنوان (title)
            if (product.title && product.title.toLowerCase().includes(query)) {
                found = true;
                productList.innerHTML += `
                <div class="team-card">
                    <h3 style="font-size: 1.1rem; margin-bottom: 10px;">${product.title}</h3>
                    <p style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin: 0;">${product.price} SAR</p>
                    <p style="color: #6b7280; font-size: 0.9rem;">Store: <strong>${product.source}</strong></p>
                    <div class="card-actions">
                        <a href="${product.link}" target="_blank" class="action-btn btn-store"><i class="fa-solid fa-cart-shopping"></i> View Store</a>
                        <button onclick="showPriceHistory('${product.title.replace(/'/g, "\\'")}')" class="action-btn btn-history">Price History</button>
                    </div>
                </div>`;
            }
        });

        if (!found) {
            productList.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><p>No products found for "<strong>${query}</strong>".</p></div>`;
        }

        showPage("results");

    } catch (error) {
        console.error("Search Error:", error);
        Swal.fire('Error', 'Failed to connect to Firebase. Try using a Mobile Hotspot.', 'error');
    } finally {
        toggleLoading(false);
    }
}