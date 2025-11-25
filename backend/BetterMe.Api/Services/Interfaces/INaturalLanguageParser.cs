using BetterMe.Api.DTOs.Task;

namespace BetterMe.Api.Services.Interfaces
{
    public interface INaturalLanguageParser
    {
        ParseTaskResponse ParseTaskInput(string input);
    }
}

