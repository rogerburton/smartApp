var scenario1={
1 : `flowchart LR
subgraph sg_etape1[REA - une présentation]
  subgraph rea_doc_initial2[Ex. : achat par une UP]
          SD_i2000[FOU FFF001]
          SD_i2001[UP 489000001]
          SD_i2002["\`general
goods and services\`"]
          SD_i2003[Money]
          SD_i2000-- owns -->SD_i2002
          SD_i2000-- wants -->SD_i2003
          SD_i2001-- owns -->SD_i2003
          SD_i2001-- wants -->SD_i2002
  end
  subgraph rea_doc_initial1[Ex. : vente par une UP]
          SD_i1000[UP 489000001]
          SD_i1001[CLI CCC001]
          SD_i1002["\`general
goods and services\`"]
          SD_i1003[Money]
          SD_i1000-- owns -->SD_i1002
          SD_i1000-- wants -->SD_i1003
          SD_i1001-- owns -->SD_i1003
          SD_i1001-- wants -->SD_i1002
  end
  subgraph sg_texte1[Le modèle REA]
    texte1["\`
  Le modèle REA est basé sur un triplet Ressources/Agents/Evènements.
  Un agent A possède (owns ou plus neutre :  has custody) des ressources X.
  Un autre agent B possède des ressources Y.
  Chaque agent convoite (covets, desires, wants) les ressources de l'autre.
  La négociation consiste à s'accorder entre agents sur l'équivalence des ressources à échanger, en nature, qualité et quantité.
  Les deux exemples vente et achat montrent que ces deux opérations se représentent exactement de la même manière.
    \`"]
  end
end
`,
2 : `flowchart LR
subgraph recipient[Les destinataires des déclarations]
  ex200[par ex.: ONSS, client, salarié, Intervat, ...]
end
subgraph sg_rules[Rules]
 ex0[blablabla]
end
subgraph sg_projections[Projections]
    subgraph sg_projection_comptable[Projection comptable]
      ex1[blablabla]
    end
    subgraph sg_projection_declarative[Projection déclarative]
      ex2[blablabla]
    end
end
subgraph sg_plan_conformite[Régulation de la conformité]
    subgraph sg_regulation_declarative[Régulation déclarative]
      ex3[blablabla]
    end
    subgraph sg_regulation_business[Régulation déclarative]
      ex4[blablabla]
    end
    subgraph sg_regulation_onto[Ontologies]
      ex44[blablabla]
    end
end
subgraph sg_plan_rea[Plan Business REA]
    subgraph sg_rea_additional[rea Additional]
      subgraph rea_vat[add. a]
        ex5[blablabla]
      end
    end
    subgraph sg_rea_secondary[rea Secondary]
      subgraph rea_cmf[sec. a]
        ex6[blablabla]
      end
      subgraph rea_shared_vat[sec. b]
        ex7[blablabla]
      end
    end
    subgraph sg_saisie_doc[Saisie documentaire]
        ex8[blablabla]
    end
end
subgraph user[Utilisateur]
  ex10[par ex.: le titulaire d'une UP]
end
subgraph sg_texte2[Les plans containers]
    texte1["\`
Notre modèle d'affaires,selon moi en même temps modèles organisationnel, conceptuel et du système applicatif repose sur plusieurs plans.
\`"]
end
user -- entrée des spécifications de l'échange --> sg_saisie_doc
sg_projections -- déclarations --> recipient
sg_rules -- spécifie --> sg_projections
sg_plan_conformite -- spécifie --> sg_rules
sg_plan_conformite -- spécifie --> sg_projections
sg_plan_rea -- appelle --> sg_rules
sg_plan_conformite -- spécifie --> sg_plan_rea
`,





  
1000 : `flowchart LR
subgraph sg_rules[Rules]
    subgraph sg_events_rules[EventsRules]
      RL_e1000[règle delai]
      RL_e1001[règle ...]
      RL_e1002[règle ...]
    end
    subgraph sg_accounting_rules[AccountingRules]
      RL_a1000[règle ...]
      RL_a1001[règle ...]
      RL_a1002[règle ...]
    end
    subgraph sg_statement_rules[StatementRules]
      RL_s1000[règle ...]
      RL_s1001[règle ...]
      RL_s1002[règle ...]
    end
    subgraph sg_rea_rules[reaRules]
      RL_b1000[règle typeAgents]
      RL_b1001[règle hasVAT]
      RL_b1002[règle ...]
    end
end

subgraph sg_projections[Projections]
    subgraph sg_projection_comptable[Projection comptable]
      P_pc1000[400 Clients]
      P_pc1001[700 ClA]
      P_pc1000-- htva -->P_pc1001
    end
    subgraph sg_projection_declarative[Projection déclarative]
      P_pd1000[Intervat monthly]
      P_pd1001[Intervat annualListing]
      P_pd1002[Invoice]
      P_pd1003[DebitNote]
      P_pd1004[Statement]
    end
end

subgraph sg_plan_conformite[Régulation de la conformité]
    subgraph sg_regulation_declarative[Régulation déclarative]
      RC_rd1001[rd1]
    end
    subgraph sg_regulation_business[Régulation déclarative]
      RC_rb1001[rb1]
    end
end

subgraph sg_plan_rea[Plan Business REA INIT]
    subgraph sg_events[Events]
      B_e1000[cron]
      B_e1001[action]
      B_e1000-- jesaispasquoi -->B_e1001
    end
    subgraph sg_rea_additional[rea Additional]
      subgraph rea_vat['VAT']
          BA_v1000[agent VAT]
          BA_v1001[agent A]
          BA_v1002[Quitus due VAT]
          BA_v1003[Money]
          BA_v1000-- owns -->BA_v1002
          BA_v1000-- wants -->BA_v1003
          BA_v1001-- owns -->BA_v1003
          BA_v1001-- wants -->BA_v1002
      end
    end
    subgraph sg_rea_secondary[rea Secondary]
      subgraph rea_cmf[CMF]
        RS_c1000[agent A]
        RS_c1001[agent C]
        RS_c1002[Shared_services]
        RS_c1003[Money]
        RS_c1000-- owns -->RS_c1002
        RS_c1001-- wants -->RS_c1003
        RS_c1001-- owns -->RS_c1003
        RS_c1000-- wants -->RS_c1002
      end
      subgraph rea_shared_vat[sharedVAT]
        RS_sv1000[agent A]
        RS_sv1001[Proxy]
        RS_sv1002[Quitus due VAT]
        RS_sv1003[Money]
        RS_sv1000-- owns -->RS_sv1003
        RS_sv1000-- wants -->RS_sv1002
        RS_sv1001-- owns -->RS_sv1002
        RS_sv1001-- wants -->RS_sv1003
      end
    end
    subgraph sg_saisie_doc[Saisie documentaire]
      subgraph rea_doc_initial['Initial']
        SD_i1000[agent A]
        SD_i1001[agent B]
        SD_i1002[Goods and Services generic]
        SD_i1003[Money]
        SD_i1000-- owns -->SD_i1002
        SD_i1000-- wants -->SD_i1003
        SD_i1001-- owns -->SD_i1003
        SD_i1001-- wants -->SD_i1002
      end
    end
end
  RC_rb1001-- essai -->sg_plan_rea
  RC_rd1001-- essai -->sg_projections
  rea_doc_initial-- test1 hasVAT -->RL_b1001
  rea_doc_initial-- test2 typeAgents -->RL_b1000
  RL_b1001-- test1_response hasVAT_with VAT_mandatory -->rea_vat
  RL_b1001-- test1_response hasVAT_without VAT_disabled -->rea_shared_vat
  RL_b1001-- test1_response hasVAT_without VAT_return -->rea_doc_initial
  RL_b1000-- test2_response typeAgents_noUP_return -->rea_doc_initial
  RL_b1000-- test2_response typeAgents_UP_mandatory -->sg_rea_secondary
`

};
