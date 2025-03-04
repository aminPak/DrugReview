using System.ComponentModel.DataAnnotations;

namespace DrugReview.Models
{
    public class Supplement
    {
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Required]
        public decimal Price { get; set; }

        [StringLength(500)]
        public string? Benefits { get; set; }

        [StringLength(500)]
        public string? RecommendedDosage { get; set; }

        [StringLength(500)]
        public string? Ingredients { get; set; }

        [StringLength(200)]
        public string? Category { get; set; }

        [StringLength(255)]
        public string? ImageUrl { get; set; }

        [StringLength(500)]
        public string? ExternalShopUrl { get; set; }

        public bool IsAvailable { get; set; } = true;

        [StringLength(100)]
        public string? Brand { get; set; }

        public decimal? Rating { get; set; }

        public int? ReviewCount { get; set; }
    }
}