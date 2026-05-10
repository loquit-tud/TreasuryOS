from app.schemas.models import Constitution, Decision, ProposalCreate


def evaluate_proposal(constitution: Constitution, proposal: ProposalCreate) -> Decision:
    reasons: list[str] = []
    violated_rules: list[str] = []

    if proposal.proposed_stable_reserve_pct < constitution.stable_reserve_min_pct:
        violated_rules.append("stable_reserve_min_pct")
        reasons.append(
            "Stable reserve ar cobori sub minimul constitutional definit pentru vault."
        )

    if proposal.proposed_drawdown_pct > constitution.max_drawdown_pct:
        violated_rules.append("max_drawdown_pct")
        reasons.append("Drawdown-ul proiectat depaseste limita constitutionala.")

    if proposal.proposed_rwa_exposure_pct > constitution.rwa_exposure_max_pct:
        violated_rules.append("rwa_exposure_max_pct")
        reasons.append("Expunerea RWA ar depasi plafonul permis.")

    if not constitution.leverage_allowed and proposal.proposed_leverage_enabled:
        violated_rules.append("leverage_allowed")
        reasons.append("Constitutia interzice leverage pentru acest vault.")

    if violated_rules:
        return Decision(decision="REJECT", reasons=reasons, violated_rules=violated_rules)

    return Decision(
        decision="ALLOW",
        reasons=["Propunerea respecta regulile constitutionale active."],
        violated_rules=[],
    )
