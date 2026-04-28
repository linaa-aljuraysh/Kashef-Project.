import pandas as pd
# نستورد دالة المطابقة الخاصة بكم من ملف app.py
from app import match_products

print("\n" + "="*75)
print("  [Kashef System] Running Hybrid AI Semantic Matching...")
print("   (Model: all-MiniLM-L6-v2 + Keyword Hybrid Scoring)")
print("="*75)

# 1. محاكاة بحث المستخدم في الواجهة
user_search = "Apple iPhone 15 Pro Max 256GB"
source_data = [{'name': user_search, 'price': 4500, 'brand': 'Apple'}]
source_df = pd.DataFrame(source_data)

print(f"Target Query : '{user_search}'")
print("-" * 75)

# 2. محاكاة بيانات تم سحبها من المتاجر (موجودة في قاعدة بياناتكم)
target_data = [
    {'id': 1, 'name': 'ايفون 15 برو ماكس، 256 جيجا، تيتانيوم طبيعي', 'price': 4550, 'retailer': 'Noon', 'url': '', 'brand': 'Apple', 'description': ''},
    {'id': 2, 'name': 'Apple iPhone 15 Pro Max (256GB) - Black', 'price': 4600, 'retailer': 'Amazon', 'url': '', 'brand': 'Apple', 'description': ''},
    {'id': 3, 'name': 'Samsung Galaxy S24 Ultra 256GB Titanium', 'price': 4200, 'retailer': 'Amazon', 'url': '', 'brand': 'Samsung', 'description': ''},
    {'id': 4, 'name': 'كفر حماية سيليكون متوافق مع ايفون 15 برو ماكس', 'price': 50, 'retailer': 'Noon', 'url': '', 'brand': 'Generic', 'description': ''}
]
target_df = pd.DataFrame(target_data)

# 3. تشغيل خوارزمية كاشف الحقيقية
results_df = match_products(source_df, target_df)

# 4. طباعة النتائج بشكل هندسي مرتب للتصوير
print(f"{'Scraped Product Title':<50} | {'Score':<6} | {'Confidence'}")
print("-" * 75)

if not results_df.empty:
    for index, row in results_df.iterrows():
        title = str(row['target_name'])
        # قص النص إذا كان طويلاً لترتيب الجدول
        display_title = title[:47] + "..." if len(title) > 47 else title
        print(f"{display_title:<50} | {row['ai_similarity']:.4f} | {row['confidence']}")
else:
    print("No matches found above the dynamic threshold.")

print("="*75 + "\n")