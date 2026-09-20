(function (global) {
    global.GM4Med = global.GM4Med || {};
    global.GM4Med.services = {};

    global.GM4Med.services.paciente = global.GM4Med.PacienteService || null;
    global.GM4Med.services.medico = global.GM4Med.MedicoService || null;
    global.GM4Med.services.exame = global.GM4Med.ExameService || null;
    global.GM4Med.services.agenda = global.GM4Med.AgendaService || null;
    global.GM4Med.services.atendimento = global.GM4Med.AtendimentoService || null;
    global.GM4Med.services.financeiro = global.GM4Med.FinanceiroService || null;
    global.GM4Med.services.convenio = global.GM4Med.ConvenioService || null;
    global.GM4Med.services.usuario = global.GM4Med.UsuarioService || null;
    global.GM4Med.services.relatorio = global.GM4Med.RelatorioService || null;
})(window);
