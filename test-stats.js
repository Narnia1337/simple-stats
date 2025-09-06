// Test script to verify all fixes
const API_URL = 'http://localhost:3000/api';

async function testPlayer(username) {
    console.log(`\n🔍 Testing player: ${username}`);
    console.log('─'.repeat(50));
    
    try {
        const response = await fetch(`${API_URL}/stats/${username}`);
        
        if (!response.ok) {
            console.error(`❌ Failed to fetch stats for ${username}: ${response.status}`);
            return;
        }
        
        const data = await response.json();
        
        // Check networth
        console.log(`\n💰 Wealth:`);
        console.log(`   Net Worth: ${data.netWorth || 'Not calculated'}`);
        console.log(`   Purse: ${data.purse}`);
        console.log(`   Bank: ${data.bankBalance}`);
        
        // Check slayer levels
        console.log(`\n⚔️ Slayers (Total: ${data.slayers.total}):`);
        ['zombie', 'spider', 'wolf', 'enderman', 'blaze', 'vampire'].forEach(slayer => {
            if (data.slayers[slayer] !== undefined) {
                const maxLevel = slayer === 'vampire' ? 5 : 9;
                const status = data.slayers[slayer] === maxLevel ? '✅' : '⏳';
                console.log(`   ${status} ${slayer}: ${data.slayers[slayer]}/${maxLevel}`);
            }
        });
        
        // Check skills
        console.log(`\n📊 Skills (Average: ${data.skills.average.toFixed(1)}):`);
        ['farming', 'mining', 'combat', 'foraging', 'fishing'].forEach(skill => {
            if (data.skills[skill] !== undefined) {
                console.log(`   ${skill}: ${data.skills[skill]}`);
            }
        });
        
        // Check other data
        console.log(`\n📈 Other Stats:`);
        console.log(`   SkyBlock Level: ${data.skyblockLevel}`);
        console.log(`   Catacombs: ${data.catacombs}`);
        console.log(`   Fairy Souls: ${data.fairySouls}`);
        console.log(`   Profile: ${data.profileName}`);
        
        console.log(`\n✅ All checks completed for ${username}`);
        
    } catch (error) {
        console.error(`❌ Error testing ${username}:`, error.message);
    }
}

// Test with a known player
console.log('🚀 Starting SkyBlock Stats Viewer Tests');
console.log('═'.repeat(50));

// Test with multiple players
(async () => {
    await testPlayer('Technoblade');
    await testPlayer('Dream');
    await testPlayer('InvalidPlayerName123456');
})();