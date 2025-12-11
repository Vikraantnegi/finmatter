import { getLLMService } from './index';

async function test() {
  console.log('🧪 Testing LLM Router\n');

  const llm = getLLMService();

  // Test 1: Single categorization
  console.log('1️⃣  Testing single categorization...');
  const result = await llm.categorizeTransaction('SWIGGY BANGALORE', 450);
  console.log('✅ Result:', result);
  console.log();

  // Test 2: Cached request (should be instant)
  console.log('2️⃣  Testing cached request...');
  const result2 = await llm.categorizeTransaction('SWIGGY BANGALORE', 450);
  console.log(
    '✅ Cached:',
    result2.cached,
    '| Latency:',
    `${result2.latency}ms`,
  );
  console.log();

  // Test 3: Batch categorization
  console.log('3️⃣  Testing batch categorization...');
  const batch = [
    { merchant: 'AMAZON.IN', amount: 1250 },
    { merchant: 'INDIAN OIL', amount: 2000 },
    { merchant: 'APOLLO PHARMACY', amount: 320 },
    { merchant: 'IRCTC', amount: 850 },
    { merchant: 'BIGBASKET', amount: 1500 },
  ];

  const batchResults = await llm.batchCategorize(batch);
  batchResults.forEach((r, i) => {
    console.log(`   ${batch?.[i]?.merchant} → ${r.category} (${r.latency}ms)`);
  });

  console.log('\n✅ All tests passed!');
}

test().catch(console.error);
