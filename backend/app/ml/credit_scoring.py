"""Credit scoring model mock for predicting probability of default."""

from typing import Dict, Any, Tuple


class CreditScoringModel:
    """Mock XGBoost Credit Scoring Model."""

    def __init__(self) -> None:
        pass

    def predict(self, application_data: Dict[str, Any], customer_data: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        """
        Mock prediction of default probability and SHAP feature importances.
        
        Args:
            application_data: Dictionary containing application details.
            customer_data: Dictionary containing customer details.
            
        Returns:
            A tuple of (probability_of_default, shap_values).
        """
        base_score = 0.5
        
        income = customer_data.get("income", 50000.0)
        loan_amount = application_data.get("amount", 10000.0)
        
        if income > 0:
            ratio = loan_amount / income
        else:
            ratio = 1.0
            
        prob_default = min(0.99, max(0.01, base_score + (ratio * 0.1) - 0.2))
        
        shap_values = {
            "income": -0.15 * (income / 100000),
            "loan_amount": 0.1 * (loan_amount / 50000),
            "age": -0.05,
            "employment_length": -0.08
        }
        
        return prob_default, shap_values
