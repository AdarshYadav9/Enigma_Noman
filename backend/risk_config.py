"""
Risk Engine Scoring Configuration & Centralized Constants.

The risk score is a rule-based prioritization indicator (0-100),
NOT a clinical disease probability.
Higher scores indicate more explicit dietary conflicts against the user's health profile.
"""

# Risk Score Weights
SCORE_CRITICAL_ALLERGEN = 60       # Direct allergen match or known allergen derivative
SCORE_HIGH_RISK_INGREDIENT = 30    # High-risk ingredient flagged by active medical condition
SCORE_MODERATE_RISK_INGREDIENT = 15 # Moderate-risk ingredient flagged by active medical condition
SCORE_HIGH_SODIUM = 15             # Food sodium exceeds safe daily threshold for active condition
SCORE_HIGH_SUGAR = 15              # Food sugar exceeds threshold for diabetes / hormonal condition
SCORE_USER_RESTRICTION = 20        # Conflicts with user-specific doctor or dietary restriction

# Score Caps
SCORE_MIN = 0
SCORE_MAX = 100

# Risk Level Thresholds
# Score >= 50: high risk
# Score 20 - 49: moderate risk
# Score < 20: low risk (when food is reliably identified)
THRESHOLD_HIGH_RISK = 50
THRESHOLD_MODERATE_RISK = 20

# System Confidence Thresholds (Food identification and ingredient resolution)
# 0.90–1.00 -> confirmed
# 0.70–0.89 -> likely
# 0.40–0.69 -> uncertain
# 0.00–0.39 -> unknown
CONFIDENCE_CONFIRMED = 0.90
CONFIDENCE_LIKELY = 0.70
CONFIDENCE_UNCERTAIN = 0.40

# Disclaimers
STANDARD_DISCLAIMER = (
    "This is an informational dietary risk assessment based on rule-matching against your health profile, "
    "not a clinical medical diagnosis or treatment plan."
)
UNCERTAINTY_MESSAGE_UNKNOWN = "I’m not sure about this food or item."
UNCERTAINTY_MESSAGE_PARTIAL = (
    "I can identify the food name, but I do not have enough ingredient information to provide a reliable assessment."
)
