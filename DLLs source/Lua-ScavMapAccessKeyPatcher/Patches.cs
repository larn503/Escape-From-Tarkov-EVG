using EFT;
using EFT.UI;
using UnityEngine;
using System;
using System.Reflection;
using Newtonsoft.Json;
using Aki.Common.Http;
using Aki.Reflection.Patching;

namespace Lua.ScavMapAccessKeyPatcher
{
    class Patches: ModulePatch
    {
        private static string[] itemKey;
        private static ESideType side;
        private static Locations mapConfig;
        private static Locations mapTime;

        protected override MethodBase GetTargetMethod()
        {
            return typeof(MainMenuController).GetMethod("method_39", BindingFlags.NonPublic | BindingFlags.Instance);
        }
        [PatchPrefix]
        private static void PrefixPatch(RaidSettings ___raidSettings_0)
        {
            if (mapConfig == null)
            {
                var json = RequestHandler.GetJson("/Lua/ScavMapAccessKeyPatcher/config");
                mapConfig = JsonConvert.DeserializeObject<Locations>(json);
            }
            if (mapTime == null)
            {
                var json = RequestHandler.GetJson("/Lua/ScavMapAccessKeyPatcher/maptime");
                mapTime = JsonConvert.DeserializeObject<Locations>(json);
            }

            side = ___raidSettings_0.Side;
            itemKey = ___raidSettings_0.SelectedLocation.AccessKeys;
            
            if (___raidSettings_0.Side != ESideType.Pmc)
            {
                string map = ___raidSettings_0.SelectedLocation.Id.ToLower();
                string scavAccessKey = GetMapAccessKey(map);
                int raidTime = 0;
                if (GetRaidTime(map) != "-1")
                {
                    raidTime = Mathf.RoundToInt(Int32.Parse(GetRaidTime(map)) / UnityEngine.Random.Range(1.4f, 3.0f));
                    Logger.LogMessage("Current map time limit: " + ___raidSettings_0.SelectedLocation.EscapeTimeLimit);
                    ___raidSettings_0.SelectedLocation.EscapeTimeLimit = raidTime;
                    Logger.LogMessage("New map time limit: " + ___raidSettings_0.SelectedLocation.EscapeTimeLimit);
                }
                string[] accessKeys = scavAccessKey == null || scavAccessKey.Length == 0 ? Array.Empty<string>() : new string[] { scavAccessKey };

                ___raidSettings_0.Side = ESideType.Pmc;
                ___raidSettings_0.SelectedLocation.AccessKeys = accessKeys;


                if (map == "laboratory")
                {
                    if (GameObject.Find("ErrorScreen"))
                    {
                        PreloaderUI.Instance.CloseErrorScreen();
                    }
                    PreloaderUI.Instance.ShowErrorScreen("Lua-ScavMapAccessKeyPatcher", "NO EXIT WARNING!\n==========================================\nLaboratory is not meant to be played as Scav,\nYou will lost your gears and loots.");
                }
            }
            else
            {
                string map = ___raidSettings_0.SelectedLocation.Id.ToLower();
                if (GetRaidTime(map) != "-1")
                {
                    
                    int raidTime = 0;
                    raidTime = Int32.Parse(GetRaidTime(map));
                    ___raidSettings_0.SelectedLocation.EscapeTimeLimit = raidTime;
                }
                
            }
        }
        [PatchPostfix]
        private static void PostfixPatch(RaidSettings ___raidSettings_0)
        {
            if (___raidSettings_0.Side == ESideType.Pmc && side == ESideType.Savage)
            {
                ___raidSettings_0.Side = side;
                ___raidSettings_0.SelectedLocation.AccessKeys = itemKey;
            }
        }
        public static string GetMapAccessKey(string map)
        {
            string accessKey = string.Empty;

            switch (map)
            {
                case "bigmap":
                    {
                        accessKey = mapConfig.bigmap;
                        break;
                    }
                case "factory4_day":
                    {
                        accessKey = mapConfig.factory4_day;
                        break;
                    }
                case "factory4_night":
                    {
                        accessKey = mapConfig.factory4_night;
                        break;
                    }
                case "interchange":
                    {
                        accessKey = mapConfig.interchange;
                        break;
                    }
                case "laboratory":
                    {
                        accessKey = mapConfig.laboratory;
                        break;
                    }
                case "lighthouse":
                    {
                        accessKey = mapConfig.lighthouse;
                        break;
                    }
                case "rezervbase":
                    {
                        accessKey = mapConfig.rezervbase;
                        break;
                    }
                case "shoreline":
                    {
                        accessKey = mapConfig.shoreline;
                        break;
                    }
                case "woods":
                    {
                        accessKey = mapConfig.woods;
                        break;
                    }
            }

            return accessKey;
        }
        public static string GetRaidTime(string map)
        {
            string RaidTime = string.Empty;

            switch (map)
            {
                case "bigmap":
                    {
                        RaidTime = mapTime.bigmap;
                        break;
                    }
                case "factory4_day":
                    {
                        RaidTime = mapTime.factory4_day;
                        break;
                    }
                case "factory4_night":
                    {
                        RaidTime = mapTime.factory4_night;
                        break;
                    }
                case "interchange":
                    {
                        RaidTime = mapTime.interchange;
                        break;
                    }
                case "laboratory":
                    {
                        RaidTime = mapTime.laboratory;
                        break;
                    }
                case "lighthouse":
                    {
                        RaidTime = mapTime.lighthouse;
                        break;
                    }
                case "rezervbase":
                    {
                        RaidTime = mapTime.rezervbase;
                        break;
                    }
                case "shoreline":
                    {
                        RaidTime = mapTime.shoreline;
                        break;
                    }
                case "woods":
                    {
                        RaidTime = mapTime.woods;
                        break;
                    }
            }

            return RaidTime;
        }
        public class Locations
        {
            public string bigmap { get; set; }
            public string factory4_day { get; set; }
            public string factory4_night { get; set; }
            public string interchange { get; set; }
            public string laboratory { get; set; }
            public string lighthouse { get; set; }
            public string rezervbase { get; set; }
            public string shoreline { get; set; }
            public string woods { get; set; }
        }
    }
}