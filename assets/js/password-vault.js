// Dummy Password Vault Data
const vaultData = [
    { service: "Gmail", username: "demo.user@gmail.com", password: "Password123!" },
    { service: "GitHub", username: "kiran-demo", password: "SecurePass!@12" },
    { service: "Azure Portal", username: "admin-demo@company.com", password: "AzureRocks#2024" },
    { service: "LinkedIn", username: "kiran.regmi", password: "CyberStar2024!" },
    { service: "AWS Console", username: "root-demo", password: "NotARealPassword1!" }
];

// Render Vault Table
function loadVault() {
    const table = document.getElementById("vaultTable");
    table.innerHTML = "";

    vaultData.forEach((item) => {
        const row = `
            <tr class="border-b border-gray-700">
                <td class="px-6 py-4">${item.service}</td>
                <td class="px-6 py-4">${item.username}</td>
                <td class="px-6 py-4">${"*".repeat(item.password.length)}</td>
                <td class="px-6 py-4">
                    <button class="copy-btn" onclick="copyPassword('${item.password}')">
                        Copy
                    </button>
                </td>
            </tr>
        `;
        table.insertAdjacentHTML("beforeend", row);
    });
}

// Search Filter
function filterVault() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const filtered = vaultData.filter((item) =>
        item.service.toLowerCase().includes(query) ||
        item.username.toLowerCase().includes(query)
    );

    const table = document.getElementById("vaultTable");
    table.innerHTML = "";

    filtered.forEach((item) => {
        const row = `
            <tr class="border-b border-gray-700">
                <td class="px-6 py-4">${item.service}</td>
                <td class="px-6 py-4">${item.username}</td>
                <td class="px-6 py-4">${"*".repeat(item.password.length)}</td>
                <td class="px-6 py-4">
                    <button class="copy-btn" onclick="copyPassword('${item.password}')">
                        Copy
                    </button>
                </td>
            </tr>
        `;
        table.insertAdjacentHTML("beforeend", row);
    });
}

// Copy Password
function copyPassword(pass) {
    navigator.clipboard.writeText(pass);
    alert("Password copied (dummy data)!");
}

loadVault();
