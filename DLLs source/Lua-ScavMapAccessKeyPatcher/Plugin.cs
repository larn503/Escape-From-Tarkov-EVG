using BepInEx;


namespace Lua.ScavMapAccessKeyPatcher
{
    [BepInPlugin("com.Lua.ScavMapAccessKeyPatcher", "Lua-ScavMapAccessKeyPatcher", "1.0.0")]
    public class Plugin : BaseUnityPlugin
    {
        private void Awake()
        {
            new Patches().Enable();
        }
    }
}
