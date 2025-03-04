using DrugReview.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace DrugReview.Controllers
{
    public class SupplementsController : Controller
    {
        private static readonly List<Supplement> _demoSupplements = new()
        {
            new Supplement
            {
                Id = 1,
                Name = "Omega-3 Fish Oil",
                Description = "High-quality fish oil supplement rich in EPA and DHA for heart and brain health.",
                Price = 29.99m,
                Benefits = "Supports heart health, brain function, and reduces inflammation",
                RecommendedDosage = "2 softgels daily with meals",
                Ingredients = "Fish oil concentrate, Gelatin, Glycerin, Purified water",
                Category = "Heart Health",
                ImageUrl = "https://placehold.co/400x300",
                Brand = "VitaHealth",
                Rating = 4.5m,
                ReviewCount = 128,
                ExternalShopUrl = "https://example.com/shop/omega3"
            },
            new Supplement
            {
                Id = 2,
                Name = "Vitamin D3 + K2",
                Description = "Optimal combination for calcium absorption and bone health.",
                Price = 24.99m,
                Benefits = "Supports bone health, immune function, and calcium absorption",
                RecommendedDosage = "1 capsule daily with food",
                Ingredients = "Vitamin D3 (Cholecalciferol), Vitamin K2 (MK-7), MCT oil",
                Category = "Bone Health",
                ImageUrl = "https://placehold.co/400x300",
                Brand = "PureNutrition",
                Rating = 4.8m,
                ReviewCount = 95,
                ExternalShopUrl = "https://example.com/shop/d3k2"
            },
            new Supplement
            {
                Id = 3,
                Name = "Magnesium Complex",
                Description = "High-absorption magnesium blend for optimal nerve and muscle function.",
                Price = 19.99m,
                Benefits = "Supports muscle recovery, sleep quality, and nerve function",
                RecommendedDosage = "2 capsules before bedtime",
                Ingredients = "Magnesium Glycinate, Magnesium Citrate, Magnesium Malate",
                Category = "Minerals",
                ImageUrl = "https://placehold.co/400x300",
                Brand = "MineralPlus",
                Rating = 4.6m,
                ReviewCount = 156,
                ExternalShopUrl = "https://example.com/shop/magnesium"
            },
            new Supplement
            {
                Id = 4,
                Name = "Probiotics 50B",
                Description = "High-potency probiotic blend with 50 billion CFU and 12 strains.",
                Price = 34.99m,
                Benefits = "Supports digestive health, immune system, and gut flora balance",
                RecommendedDosage = "1 capsule daily on empty stomach",
                Ingredients = "12 probiotic strains, Prebiotic fiber, Vegetable capsule",
                Category = "Digestive Health",
                ImageUrl = "https://placehold.co/400x300",
                Brand = "GutHealth",
                Rating = 4.7m,
                ReviewCount = 203,
                ExternalShopUrl = "https://example.com/shop/probiotics"
            },
            new Supplement
            {
                Id = 5,
                Name = "Turmeric Curcumin",
                Description = "Enhanced absorption curcumin with black pepper extract.",
                Price = 27.99m,
                Benefits = "Supports joint health, reduces inflammation, antioxidant properties",
                RecommendedDosage = "2 capsules daily with meals",
                Ingredients = "Turmeric extract, Curcumin, BioPerine® Black Pepper Extract",
                Category = "Joint Health",
                ImageUrl = "https://placehold.co/400x300",
                Brand = "NatureCure",
                Rating = 4.4m,
                ReviewCount = 167,
                ExternalShopUrl = "https://example.com/shop/turmeric"
            },
            new Supplement
            {
                Id = 6,
                Name = "Ashwagandha KSM-66",
                Description = "Premium ashwagandha root extract for stress and anxiety support.",
                Price = 32.99m,
                Benefits = "Reduces stress and anxiety, supports energy and focus",
                RecommendedDosage = "1 capsule twice daily",
                Ingredients = "KSM-66® Ashwagandha Extract, Organic Rice Flour",
                Category = "Stress Support",
                ImageUrl = "https://placehold.co/400x300",
                Brand = "AdaptoCare",
                Rating = 4.9m,
                ReviewCount = 142,
                ExternalShopUrl = "https://example.com/shop/ashwagandha"
            }
        };

        public IActionResult Index()
        {
            return View(_demoSupplements);
        }

        public IActionResult Details(int id)
        {
            var supplement = _demoSupplements.FirstOrDefault(s => s.Id == id);
            if (supplement == null)
            {
                return NotFound();
            }

            return View(supplement);
        }

        [Authorize]
        public IActionResult Recommendations()
        {
            // In a real application, this would use AI to generate personalized recommendations
            var recommendations = _demoSupplements.Take(3).ToList();
            return View(recommendations);
        }
    }
}